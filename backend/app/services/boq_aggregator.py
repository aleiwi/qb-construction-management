from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.boq_element import BOQElement, ElementType, ClassificationStatus
from app.models.boq_item import BOQItem
from app.models.price_library import PriceLibrary
from app.models.project import Project
from app.models.building import Building
from app.models.drawing import Drawing
from app.services.pricing_engine import price_element, calculate_markup
from app.services.quantity_engine import compute_quantity


async def aggregate_project_boq(
    db: AsyncSession,
    project_id: int,
    markup_config: Optional[Dict] = None,
) -> Dict:
    """Aggregate complete BOQ for a project including all drawings and elements."""
    # Get all buildings in project
    buildings = await db.execute(
        select(BOQElement.__table__.c.id).select_from(BOQElement)
        .join(Drawing, BOQElement.drawing_id == Drawing.id)
        .join(Building, Drawing.building_id == Building.id)
        .where(Building.project_id == project_id)
    )

    # Get all drawings for project buildings
    drawings = await db.execute(
        select(Drawing).join(Building, Drawing.building_id == Building.id)
        .where(Building.project_id == project_id)
    )
    drawings_list = drawings.scalars().all()
    drawing_ids = [d.id for d in drawings_list]

    if not drawing_ids:
        return {
            "project_id": project_id,
            "drawings_count": 0,
            "elements_count": 0,
            "classified_count": 0,
            "items_count": 0,
            "summary": _empty_summary(),
            "by_type": {},
            "by_drawing": [],
        }

    # Get all BOQ elements for these drawings
    elements = await db.execute(
        select(BOQElement).filter(BOQElement.drawing_id.in_(drawing_ids))
    )
    elements_list = elements.scalars().all()

    # Get all BOQ items (priced)
    element_ids = [e.id for e in elements_list]
    boq_items = []
    if element_ids:
        items_result = await db.execute(
            select(BOQItem).filter(BOQItem.boq_element_id.in_(element_ids))
        )
        boq_items = items_result.scalars().all()

    item_map = {item.boq_element_id: item for item in boq_items}

    # Get price library for unit prices
    price_lib = await db.execute(select(PriceLibrary))
    price_map: Dict[str, float] = {}
    for p in price_lib.scalars().all():
        price_map[p.element_type] = p.unit_price

    # Aggregate by element type
    by_type: Dict[str, Dict] = {}
    total_elements = 0
    classified_count = 0
    total_base_cost = 0.0
    total_quantity = 0.0
    items_count = 0

    by_drawing: Dict[int, Dict] = {}

    for el in elements_list:
        total_elements += 1
        if el.classification_status != ClassificationStatus.UNCLASSIFIED:
            classified_count += 1

        et_key = el.element_type.value if hasattr(el.element_type, 'value') else str(el.element_type)

        if et_key not in by_type:
            by_type[et_key] = {
                "element_type": et_key,
                "count": 0,
                "total_quantity": 0.0,
                "unit": el.unit or "م2",
                "base_cost": 0.0,
                "items_count": 0,
            }

        by_type[et_key]["count"] += 1
        by_type[et_key]["total_quantity"] += el.quantity

        # Compute quantity in primary unit
        try:
            el_type_enum = ElementType(el.element_type) if isinstance(el.element_type, str) else el.element_type
        except ValueError:
            el_type_enum = ElementType.OTHER

        dims = el.dimensions_json or {}
        qty, unit, params = compute_quantity(
            el_type_enum,
            geometry_area=el.quantity if el.unit in ("م2", "m2") else 0,
            geometry_length=el.quantity if el.unit in ("م", "m") else 0,
            dimensions=dims,
        )
        by_type[et_key]["unit"] = unit

        # Check if this element has a priced item
        item = item_map.get(el.id)
        if item:
            items_count += 1
            base = float(item.total_price or 0)
            by_type[et_key]["items_count"] += 1
            by_type[et_key]["base_cost"] += base
            total_base_cost += base

        # Drawing-level tracking
        d_id = el.drawing_id
        if d_id not in by_drawing:
            by_drawing[d_id] = {
                "drawing_id": d_id,
                "elements_count": 0,
                "classified_count": 0,
                "total_quantity": 0.0,
                "base_cost": 0.0,
            }
        by_drawing[d_id]["elements_count"] += 1
        by_drawing[d_id]["classified_count"] += 1 if el.classification_status != ClassificationStatus.UNCLASSIFIED else 0
        by_drawing[d_id]["total_quantity"] += el.quantity
        if item:
            by_drawing[d_id]["base_cost"] += float(item.total_price or 0)

    # Calculate markup
    markup = calculate_markup(total_base_cost, **(markup_config or {}))

    # Compare automatic vs manual pricing
    auto_cost = sum(
        price_map.get(et, 0) * by_type[et]["total_quantity"]
        for et in by_type
    )

    return {
        "project_id": project_id,
        "drawings_count": len(drawings_list),
        "elements_count": total_elements,
        "classified_count": classified_count,
        "unclassified_count": total_elements - classified_count,
        "items_count": items_count,
        "summary": {
            "total_base_cost": round(total_base_cost, 2),
            "estimated_auto_cost": round(auto_cost, 2),
            **markup,
            "elements_per_drawing": round(total_elements / max(len(drawings_list), 1), 1),
        },
        "by_type": {k: {**v, "total_quantity": round(v["total_quantity"], 4)} for k, v in sorted(by_type.items(), key=lambda x: x[1]["base_cost"], reverse=True)},
        "by_drawing": sorted(by_drawing.values(), key=lambda x: x["base_cost"], reverse=True),
    }


def _empty_summary() -> Dict:
    markup = calculate_markup(0)
    return {
        "total_base_cost": 0,
        "estimated_auto_cost": 0,
        **markup,
        "elements_per_drawing": 0,
    }
