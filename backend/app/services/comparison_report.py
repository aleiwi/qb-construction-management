from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.boq_element import BOQElement, ClassificationStatus, ElementType
from app.models.boq_item import BOQItem
from app.models.drawing import Drawing
from app.models.price_library import PriceLibrary


async def generate_comparison_report(db: AsyncSession, project_id: int) -> Dict:
    drawings_result = await db.execute(
        select(Drawing).filter(Drawing.project_id == project_id)
    )
    drawings = drawings_result.scalars().all()
    drawing_ids = [d.id for d in drawings]

    if not drawing_ids:
        return {
            "project_id": project_id,
            "total_elements": 0,
            "auto_elements": 0,
            "manual_elements": 0,
            "unclassified_elements": 0,
            "comparisons": [],
            "summary": {"type_variance": 0, "qty_variance": 0, "cost_variance": 0},
        }

    elements_result = await db.execute(
        select(BOQElement).filter(BOQElement.drawing_id.in_(drawing_ids))
    )
    elements = elements_result.scalars().all()

    total = len(elements)
    auto_count = sum(1 for e in elements if e.classification_status == ClassificationStatus.AUTO_CLASSIFIED)
    manual_count = sum(1 for e in elements if e.classification_status == ClassificationStatus.MANUALLY_CLASSIFIED)
    unclassified_count = sum(1 for e in elements if e.classification_status == ClassificationStatus.UNCLASSIFIED)

    comparisons = []
    for e in elements:
        if e.classification_status == ClassificationStatus.UNCLASSIFIED:
            continue
        auto_type = None
        manual_type = None
        if e.classification_status == ClassificationStatus.AUTO_CLASSIFIED:
            auto_type = e.element_type.value if isinstance(e.element_type, ElementType) else e.element_type
        elif e.classification_status == ClassificationStatus.MANUALLY_CLASSIFIED:
            manual_type = e.element_type.value if isinstance(e.element_type, ElementType) else e.element_type

        item_cost = 0.0
        if e.boq_items:
            item_cost = sum(float(i.total_price) for i in e.boq_items)

        comparisons.append({
            "element_id": e.id,
            "layer": e.source_layer_name,
            "auto_type": auto_type,
            "manual_type": manual_type,
            "agrees": (auto_type == manual_type) if (auto_type and manual_type) else None,
            "quantity": float(e.quantity),
            "cost": item_cost,
        })

    # Determine if auto and manual disagree globally
    type_variance = 0
    qty_variance = 0.0
    cost_variance = 0.0
    match_count = sum(1 for c in comparisons if c["agrees"] is True)
    mismatch_count = sum(1 for c in comparisons if c["agrees"] is False)

    if manual_count > 0 and auto_count > 0:
        auto_elems = [e for e in elements if e.classification_status == ClassificationStatus.AUTO_CLASSIFIED]
        manual_elems = [e for e in elements if e.classification_status == ClassificationStatus.MANUALLY_CLASSIFIED]
        auto_qty = sum(float(e.quantity) for e in auto_elems) or 1
        manual_qty = sum(float(e.quantity) for e in manual_elems)
        qty_variance = abs(manual_qty - auto_qty) / auto_qty * 100

        auto_cost = sum(float(i.total_price) for e in auto_elems for i in (e.boq_items or []))
        manual_cost = sum(float(i.total_price) for e in manual_elems for i in (e.boq_items or []))
        if auto_cost > 0:
            cost_variance = abs(manual_cost - auto_cost) / auto_cost * 100

    return {
        "project_id": project_id,
        "total_elements": total,
        "auto_elements": auto_count,
        "manual_elements": manual_count,
        "unclassified_elements": unclassified_count,
        "type_agreements": match_count,
        "type_mismatches": mismatch_count,
        "comparisons": comparisons,
        "summary": {
            "type_variance_pct": round(type_variance / max(total, 1) * 100, 1) if total > 0 else 0,
            "qty_variance_pct": round(qty_variance, 1),
            "cost_variance_pct": round(cost_variance, 1),
        },
    }
