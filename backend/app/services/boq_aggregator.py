from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.boq_element import BOQElement, ElementType, ClassificationStatus
from app.models.boq_item import BOQItem
from app.models.price_library import PriceLibrary
from app.models.building import Building
from app.models.drawing import Drawing
from app.services.pricing_engine import calculate_markup, DEFAULT_MARKUP
from app.services.quantity_engine import compute_quantity, estimate_rebar


# Canonical ElementType -> PriceLibrary keys fallback (P0 fix: SEED_PRICES uses
# concrete_*/door_* keys while BOQElement uses wall/column/... — direct lookup
# returned ~0 for estimated_auto_cost).
ELEMENT_TO_PRICE_KEYS: Dict[str, List[str]] = {
    "wall": ["wall", "concrete_wall", "partition"],
    "column": ["column", "concrete_column"],
    "slab": ["slab", "concrete_slab"],
    "beam": ["beam", "concrete_beam"],
    "foundation": ["foundation", "concrete_foundation"],
    "door": ["door", "door_wood", "door_metal", "door_aluminum"],
    "window": ["window", "window_aluminum", "window_glass"],
    "stairs": ["stairs", "concrete_stairs"],
    "roof": ["roof", "concrete_slab"],
    "partition": ["partition", "partition_gypsum", "partition_plaster", "plastering"],
    "opening": ["opening"],
    "furniture": ["furniture"],
    "other": ["other"],
}


def _lookup_unit_price(element_type_key: str, price_map: Dict[str, float]) -> float:
    """Best-match unit price for a canonical element type key."""
    for key in ELEMENT_TO_PRICE_KEYS.get(element_type_key, [element_type_key]):
        if key in price_map and price_map[key]:
            return float(price_map[key] or 0)
    return float(price_map.get(element_type_key, 0) or 0)


async def aggregate_project_boq(
    db: AsyncSession,
    project_id: int,
    markup_config: Optional[Dict] = None,
) -> Dict:
    """Aggregate complete BOQ for a project including all drawings and elements."""

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
            "unclassified_count": 0,
            "items_count": 0,
            "unpriced_count": 0,
            "estimated_count": 0,
            "is_partial": False,
            "summary": _empty_summary(markup_config),
            "by_type": {},
            "by_drawing": [],
        }

    # Stream BOQ elements in chunks (P1: a big project can hold tens of
    # thousands of elements — loading them + all BOQItems in two giant
    # queries OOMs the worker; per-chunk aggregation keeps memory bounded
    # while producing byte-identical totals). IN-clauses are sub-chunked at
    # 500 to stay under SQLite's variable limit. expunge_all per chunk keeps
    # the session identity-map flat (else 1M+ tracked objects → GC crawl).
    ELEMENT_CHUNK = 10000
    IN_CHUNK = 500

    # Get price library for unit prices (small table — single query)
    price_lib = await db.execute(select(PriceLibrary))
    price_map: Dict[str, float] = {}
    for p in price_lib.scalars().all():
        price_map[p.element_type] = p.unit_price

    # Aggregate by element type
    by_type: Dict[str, Dict] = {}
    total_elements = 0
    classified_count = 0
    estimated_count = 0
    total_base_cost = 0.0
    total_quantity = 0.0
    items_count = 0

    by_drawing: Dict[int, Dict] = {}

    def _track_element(el, item) -> None:
        nonlocal total_elements, classified_count, estimated_count, total_base_cost, items_count
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
                "estimated_count": 0,
            }

        by_type[et_key]["count"] += 1
        by_type[et_key]["total_quantity"] += float(el.quantity or 0)

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
        if params.get("is_estimated"):
            estimated_count += 1
            by_type[et_key]["estimated_count"] += 1

        # Check if this element has a priced item
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
        by_drawing[d_id]["total_quantity"] += float(el.quantity or 0)
        if item:
            by_drawing[d_id]["base_cost"] += float(item.total_price or 0)

    offset = 0
    # Keyset pagination (WHERE id > last) — OFFSET يعيد مسح الجدول من البداية
    # كل دفعة (O(n²) على مليون+ صف). أعمدة فقط بلا ORM: بلا تتبع هوية وبلا
    # تحميل علاقات، وبدون expunge لأن لا كائنات معلقة أصلًا.
    cols = (
        BOQElement.id, BOQElement.drawing_id, BOQElement.element_type,
        BOQElement.classification_status, BOQElement.quantity,
        BOQElement.unit, BOQElement.dimensions_json,
    )
    last_id = 0
    while True:
        rows = (
            await db.execute(
                select(*cols)
                .filter(BOQElement.drawing_id.in_(drawing_ids), BOQElement.id > last_id)
                .order_by(BOQElement.id)
                .limit(ELEMENT_CHUNK)
            )
        ).mappings().all()
        if not rows:
            break
        chunk_ids = [r["id"] for r in rows]
        chunk_items = {}
        for i in range(0, len(chunk_ids), IN_CHUNK):
            sub = chunk_ids[i:i + IN_CHUNK]
            res = await db.execute(
                select(BOQItem).filter(BOQItem.boq_element_id.in_(sub))
            )
            for it in res.scalars().all():
                chunk_items[it.boq_element_id] = it
        for r in rows:
            _track_element(r, chunk_items.get(r["id"]))
        last_id = rows[-1]["id"]
        if len(rows) < ELEMENT_CHUNK:
            break

    # Calculate markup (project overrides resolved over global defaults;
    # effective rates are echoed so the UI can label them honestly).
    rates = {**DEFAULT_MARKUP, **(markup_config or {})}
    markup = calculate_markup(
        total_base_cost,
        profit_margin=rates["profit_margin"],
        overhead_percent=rates["overhead_percent"],
        contingency_percent=rates["contingency_percent"],
        vat_rate=rates["vat_rate"],
    )

    # Compare automatic vs manual pricing (best-match fallback across key namespaces)
    auto_cost = sum(
        _lookup_unit_price(et, price_map) * by_type[et]["total_quantity"]
        for et in by_type
    )

    # Reinforcement estimate (M3 merge): planning-level steel kg from concrete
    # volumes only — count/area types (door/window/partition/...) get 0.
    total_rebar_kg = 0.0
    for et, data in by_type.items():
        try:
            et_enum = ElementType(et)
        except ValueError:
            et_enum = ElementType.OTHER
        if et_enum in (
            ElementType.WALL, ElementType.COLUMN, ElementType.SLAB,
            ElementType.BEAM, ElementType.FOUNDATION, ElementType.STAIRS,
            ElementType.ROOF,
        ):
            kg, _ = estimate_rebar(et_enum, data["total_quantity"])
        else:
            kg = 0.0
        data["rebar_kg"] = round(kg, 2)
        total_rebar_kg += kg

    unpriced_classified = max(classified_count - items_count, 0)
    return {
        "project_id": project_id,
        "drawings_count": len(drawings_list),
        "elements_count": total_elements,
        "classified_count": classified_count,
        "unclassified_count": total_elements - classified_count,
        "items_count": items_count,
        "unpriced_count": unpriced_classified,
        "estimated_count": estimated_count,
        "is_partial": (total_elements - classified_count) > 0 or unpriced_classified > 0 or estimated_count > 0,
        "summary": {
            "total_base_cost": round(total_base_cost, 2),
            "estimated_auto_cost": round(auto_cost, 2),
            "total_rebar_kg": round(total_rebar_kg, 2),
            "total_rebar_tons": round(total_rebar_kg / 1000, 3),
            "rates": rates,
            "custom_rates": bool(markup_config),
            **markup,
            "elements_per_drawing": round(total_elements / max(len(drawings_list), 1), 1),
        },
        "by_type": {k: {**v, "total_quantity": round(v["total_quantity"], 4)} for k, v in sorted(by_type.items(), key=lambda x: x[1]["base_cost"], reverse=True)},
        "by_drawing": sorted(by_drawing.values(), key=lambda x: x["base_cost"], reverse=True),
    }


def _empty_summary(markup_config: Optional[Dict] = None) -> Dict:
    rates = {**DEFAULT_MARKUP, **(markup_config or {})}
    markup = calculate_markup(
        0,
        profit_margin=rates["profit_margin"],
        overhead_percent=rates["overhead_percent"],
        contingency_percent=rates["contingency_percent"],
        vat_rate=rates["vat_rate"],
    )
    return {
        "total_base_cost": 0,
        "estimated_auto_cost": 0,
        "total_rebar_kg": 0,
        "total_rebar_tons": 0,
        "rates": rates,
        "custom_rates": bool(markup_config),
        **markup,
        "elements_per_drawing": 0,
    }
