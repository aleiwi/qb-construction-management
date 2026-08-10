from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.boq_element import BOQElement, ElementType, ClassificationStatus
from app.models.drawing import Drawing
from app.services.classifier_rules import classify as rules_classify
from app.services.confidence_scorer import score_classification
from app.services.context_analyzer import build_context, get_classification_features
from app.services.auto_learner import get_memory, record_classification


async def run_pipeline_for_element(
    element: BOQElement,
    text_labels: Optional[List[str]] = None,
    use_llm: bool = False,
) -> Tuple[ElementType, ClassificationStatus, float, str]:
    context = {
        "source_layer_name": element.source_layer_name,
        "type": "",
        "quantity": element.quantity,
        "unit": element.unit,
        "dimensions_json": element.dimensions_json,
        "text_labels": text_labels or [],
    }

    ctx = build_context(
        layer_name=element.source_layer_name,
        geometry_type="",
        quantity=element.quantity,
        unit=element.unit,
        dimensions_json=element.dimensions_json,
        text_labels=text_labels,
    )

    features = get_classification_features(ctx)
    memory = get_memory()

    # Phase 1: Memory (learned patterns)
    memory_type = memory.lookup(element.source_layer_name)
    if memory_type:
        return (memory_type, ClassificationStatus.AUTO_CLASSIFIED, 0.90, "memory")

    # Phase 2: Rules
    rule_result = rules_classify(ctx)
    rule_tuple = (rule_result.element_type, rule_result.confidence) if rule_result else None

    if rule_result and rule_result.confidence >= 0.85:
        final_type, status, confidence = score_classification(
            rule_result.element_type, rule_tuple, None, features
        )
        return (final_type, status, confidence, "rule")

    # Phase 3: LLM (optional)
    llm_tuple = None
    if use_llm:
        from app.services.llm_classifier import classify as llm_classify
        try:
            llm_result = await llm_classify(ctx)
            llm_tuple = llm_result if llm_result else None
        except Exception:
            pass

    final_type, status, confidence = score_classification(
        ElementType.OTHER, rule_tuple, llm_tuple, features
    )
    source = "llm" if llm_tuple else ("rule" if rule_tuple else "none")

    return (final_type, status, confidence, source)


async def reclassify_unclassified(
    db: AsyncSession,
    user_id: int,
    use_llm: bool = False,
    limit: int = 200,
) -> dict:
    """Run AI classification on all unclassified elements."""
    result = await db.execute(
        select(BOQElement)
        .filter(BOQElement.classification_status == ClassificationStatus.UNCLASSIFIED)
        .limit(limit)
    )
    elements = result.scalars().all()

    classified = 0
    still_unclassified = 0
    errors = 0

    for element in elements:
        try:
            # Collect nearby text from same drawing
            text_labels = []
            if element.dimensions_json:
                text_labels = element.dimensions_json.get("_text_labels", [])

            new_type, new_status, confidence, source = await run_pipeline_for_element(
                element, text_labels=text_labels, use_llm=use_llm
            )

            if new_status == ClassificationStatus.AUTO_CLASSIFIED and confidence >= 0.6:
                element.element_type = new_type
                element.classification_status = new_status
                element.classified_by = user_id
                if element.dimensions_json is None:
                    element.dimensions_json = {}
                if isinstance(element.dimensions_json, dict):
                    element.dimensions_json["ai_confidence"] = round(confidence, 4)
                    element.dimensions_json["classifier_source"] = source
                db.add(element)
                classified += 1
            else:
                # Still unclassified — store confidence for UI
                if element.dimensions_json is None:
                    element.dimensions_json = {}
                if isinstance(element.dimensions_json, dict):
                    element.dimensions_json["ai_confidence"] = round(confidence, 4)
                    element.dimensions_json["classifier_source"] = source
                db.add(element)
                still_unclassified += 1
        except Exception:
            errors += 1

    await db.commit()

    return {
        "processed": len(elements),
        "classified": classified,
        "still_unclassified": still_unclassified,
        "errors": errors,
    }


async def reclassify_drawing(
    db: AsyncSession,
    drawing_id: int,
    user_id: int,
    use_llm: bool = False,
) -> dict:
    result = await db.execute(
        select(BOQElement)
        .filter(BOQElement.drawing_id == drawing_id)
        .filter(BOQElement.classification_status == ClassificationStatus.UNCLASSIFIED)
    )
    elements = result.scalars().all()

    classified = 0
    for element in elements:
        try:
            new_type, new_status, confidence, source = await run_pipeline_for_element(
                element, use_llm=use_llm
            )
            if new_status == ClassificationStatus.AUTO_CLASSIFIED and confidence >= 0.6:
                element.element_type = new_type
                element.classification_status = new_status
                element.classified_by = user_id
                if element.dimensions_json is None:
                    element.dimensions_json = {}
                if isinstance(element.dimensions_json, dict):
                    element.dimensions_json["ai_confidence"] = round(confidence, 4)
                    element.dimensions_json["classifier_source"] = source
                db.add(element)
                classified += 1
        except Exception:
            pass

    # Update drawing counts
    drawing_result = await db.execute(select(Drawing).filter(Drawing.id == drawing_id))
    drawing = drawing_result.scalars().first()
    if drawing:
        total = await db.execute(
            select(func.count(BOQElement.id)).filter(BOQElement.drawing_id == drawing_id)
        )
        unclass = await db.execute(
            select(func.count(BOQElement.id))
            .filter(BOQElement.drawing_id == drawing_id)
            .filter(BOQElement.classification_status == ClassificationStatus.UNCLASSIFIED)
        )
        class_ = await db.execute(
            select(func.count(BOQElement.id))
            .filter(BOQElement.drawing_id == drawing_id)
            .filter(BOQElement.classification_status != ClassificationStatus.UNCLASSIFIED)
        )
        drawing.elements_count = total.scalar() or 0
        drawing.classified_count = class_.scalar() or 0
        drawing.unclassified_count = unclass.scalar() or 0
        db.add(drawing)

    await db.commit()
    return {"processed": len(elements), "classified": classified}


async def get_classification_stats(db: AsyncSession) -> dict:
    total = await db.execute(select(func.count(BOQElement.id)))
    unclass = await db.execute(
        select(func.count(BOQElement.id))
        .filter(BOQElement.classification_status == ClassificationStatus.UNCLASSIFIED)
    )
    auto = await db.execute(
        select(func.count(BOQElement.id))
        .filter(BOQElement.classification_status == ClassificationStatus.AUTO_CLASSIFIED)
    )
    manual = await db.execute(
        select(func.count(BOQElement.id))
        .filter(BOQElement.classification_status == ClassificationStatus.MANUALLY_CLASSIFIED)
    )

    # Count by element type
    type_query = await db.execute(
        select(BOQElement.element_type, func.count(BOQElement.id).label("cnt"))
        .group_by(BOQElement.element_type)
        .order_by(func.count(BOQElement.id).desc())
    )
    by_type = {row.element_type: row.cnt for row in type_query.all()}

    # Count by confidence brackets (from dimensions_json)
    memory = get_memory()

    return {
        "total_elements": total.scalar() or 0,
        "unclassified": unclass.scalar() or 0,
        "auto_classified": auto.scalar() or 0,
        "manually_classified": manual.scalar() or 0,
        "by_type": by_type,
        "patterns_learned": memory.size(),
    }
