import math
import re
from decimal import Decimal
from typing import Dict, Optional, Tuple
from app.models.boq_element import ElementType


def _num(value) -> float:
    if isinstance(value, Decimal):
        return float(value)
    if value is None:
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _bbox_length_thickness(dims: Dict) -> Tuple[Optional[float], Optional[float]]:
    """من أبعاد المستطيل المحيط: (الطول، السماكة). الطول = الضلع الأطول."""
    bw = _num(dims.get("bbox_width", 0))
    bh = _num(dims.get("bbox_height", 0))
    if bw <= 0 or bh <= 0:
        return None, None
    long_side, short_side = max(bw, bh), min(bw, bh)
    if long_side <= 0:
        return None, None
    return round(long_side, 4), round(short_side, 4)


QUANTITY_RULES: Dict[ElementType, dict] = {
    ElementType.WALL: {
        "primary_unit": "م3",
        "formula": "length * height * thickness",
        "default_height": 3.0,
        "default_thickness": 0.2,
        "description": "جدار خرساني",
        "unit_price_ref": "concrete_wall",
    },
    ElementType.COLUMN: {
        "primary_unit": "م3",
        "formula": "width * depth * height",
        "default_height": 3.0,
        "default_width": 0.3,
        "default_depth": 0.3,
        "description": "عمود خرساني",
        "unit_price_ref": "concrete_column",
    },
    ElementType.SLAB: {
        "primary_unit": "م3",
        "formula": "area * thickness",
        "default_thickness": 0.2,
        "description": "بلاطة خرسانية",
        "unit_price_ref": "concrete_slab",
    },
    ElementType.BEAM: {
        "primary_unit": "م3",
        "formula": "width * depth * length",
        "default_width": 0.3,
        "default_depth": 0.5,
        "description": "كمرة خرسانية",
        "unit_price_ref": "concrete_beam",
    },
    ElementType.FOUNDATION: {
        "primary_unit": "م3",
        "formula": "area * depth",
        "default_depth": 0.5,
        "description": "أساس خرساني",
        "unit_price_ref": "concrete_foundation",
    },
    ElementType.DOOR: {
        "primary_unit": "قطعة",
        "formula": "count",
        "description": "باب",
        "unit_price_ref": "door",
    },
    ElementType.WINDOW: {
        "primary_unit": "قطعة",
        "formula": "count",
        "description": "نافذة",
        "unit_price_ref": "window",
    },
    ElementType.STAIRS: {
        "primary_unit": "م3",
        "formula": "width * length * height / 2",
        "default_width": 1.2,
        "default_length": 3.0,
        "default_height": 3.0,
        "description": "درج خرساني",
        "unit_price_ref": "concrete_stairs",
    },
    ElementType.ROOF: {
        "primary_unit": "م3",
        "formula": "area * thickness",
        "default_thickness": 0.15,
        "description": "سقف",
        "unit_price_ref": "concrete_slab",
    },
    ElementType.PARTITION: {
        "primary_unit": "م2",
        "formula": "length * height",
        "default_height": 3.0,
        "description": "جدار فاصل",
        "unit_price_ref": "partition",
    },
    ElementType.OPENING: {
        "primary_unit": "م2",
        "formula": "width * height",
        "default_width": 1.0,
        "default_height": 2.0,
        "description": "فتحة",
        "unit_price_ref": "opening",
    },
    ElementType.OTHER: {
        "primary_unit": "م2",
        "formula": "area",
        "description": "عنصر غير مصنف",
        "unit_price_ref": None,
    },
}


def compute_quantity(
    element_type: ElementType,
    geometry_area: float = 0,
    geometry_length: float = 0,
    dimensions: Optional[Dict] = None,
) -> Tuple[float, str, Dict]:
    """Compute construction quantity from element type and geometry."""
    rule = QUANTITY_RULES.get(element_type, QUANTITY_RULES[ElementType.OTHER])
    dims = {}
    for k, v in (dimensions or {}).items():
        if k == "_text_labels":
            dims[k] = v
        else:
            dims[k] = _num(v)
    geometry_area = _num(geometry_area)
    geometry_length = _num(geometry_length)
    params = {}
    qty = 0.0

    if element_type in (ElementType.DOOR, ElementType.WINDOW):
        qty = 1.0  # Count-based
        params["count"] = 1
        return (qty, rule["primary_unit"], params)

    if element_type == ElementType.WALL:
        # ج1: لا نستنتج الطول من المساحة بالجذر التربيعي (كان خطأ -82%).
        # الطول = الضلع الأطول من المستطيل المحيط (bbox)، السماكة = الأقصر.
        # ج5: قياس DIMENSION المرتبط مكانيًا له الأولوية.
        bbox_len, bbox_thk = _bbox_length_thickness(dims)
        length = dims.get("dim_length", 0) or geometry_length or dims.get("length", 0) or bbox_len or 5.0
        thickness = dims.get("dim_thickness", 0) or _extract_dim_from_text(dims, "thickness") or bbox_thk or rule["default_thickness"]
        height = _extract_dim_from_text(dims, "height") or rule["default_height"]
        qty = length * height * thickness
        # ج6: خصم فتحات الأبواب/النوافذ الواقعة على الجدار (مساحة واجهة × السماكة)
        deduction = max(_num(dims.get("opening_deduction_m2", 0)), 0.0)
        if deduction > 0:
            qty = max(qty - deduction * thickness, 0.0)
        params = {"length": round(length, 2), "height": round(height, 2), "thickness": round(thickness, 2)}

    elif element_type == ElementType.COLUMN:
        # ج3: العمود الدائري يجب أن يُحسب بمساحة الدائرة πr² وليس المربع (2r)².
        radius = _num(dims.get("radius", 0))
        if radius > 0:
            eq_side = math.sqrt(math.pi) * radius  # side بحيث side² = πr²
            width = dims.get("dim_width", 0) or _extract_dim_from_text(dims, "width") or eq_side
            depth = dims.get("dim_depth", 0) or _extract_dim_from_text(dims, "depth") or eq_side
        else:
            width = dims.get("dim_width", 0) or _extract_dim_from_text(dims, "width") or dims.get("width", 0) or rule["default_width"]
            depth = dims.get("dim_depth", 0) or _extract_dim_from_text(dims, "depth") or width or rule["default_depth"]
        height = _extract_dim_from_text(dims, "height") or rule["default_height"]
        qty = width * depth * height
        params = {"width": round(width, 2), "depth": round(depth, 2), "height": round(height, 2)}

    elif element_type in (ElementType.SLAB, ElementType.ROOF):
        area = geometry_area or dims.get("area", 0) or 10.0
        thickness = _extract_dim_from_text(dims, "thickness") or rule["default_thickness"]
        qty = area * thickness
        params = {"area": round(area, 2), "thickness": round(thickness, 2)}

    elif element_type == ElementType.BEAM:
        bbox_len, bbox_w = _bbox_length_thickness(dims)
        length = dims.get("dim_length", 0) or geometry_length or dims.get("length", 0) or bbox_len or 4.0
        width = dims.get("dim_width", 0) or _extract_dim_from_text(dims, "width") or bbox_w or rule["default_width"]
        depth = _extract_dim_from_text(dims, "depth") or rule["default_depth"]
        qty = width * depth * length
        params = {"width": round(width, 2), "depth": round(depth, 2), "length": round(length, 2)}

    elif element_type == ElementType.FOUNDATION:
        area = geometry_area or dims.get("area", 0) or 4.0
        depth = _extract_dim_from_text(dims, "depth") or rule["default_depth"]
        qty = area * depth
        params = {"area": round(area, 2), "depth": round(depth, 2)}

    elif element_type == ElementType.STAIRS:
        width = _extract_dim_from_text(dims, "width") or rule["default_width"]
        length = dims.get("length", 0) or rule["default_length"]
        height = _extract_dim_from_text(dims, "height") or rule["default_height"]
        qty = width * length * height / 2
        params = {"width": round(width, 2), "length": round(length, 2), "height": round(height, 2)}

    elif element_type == ElementType.PARTITION:
        length = geometry_length or dims.get("length", 0) or 3.0
        height = _extract_dim_from_text(dims, "height") or rule["default_height"]
        qty = length * height
        params = {"length": round(length, 2), "height": round(height, 2)}

    elif element_type == ElementType.OPENING:
        width = _extract_dim_from_text(dims, "width") or rule["default_width"]
        height = _extract_dim_from_text(dims, "height") or rule["default_height"]
        qty = width * height
        params = {"width": round(width, 2), "height": round(height, 2)}

    else:
        qty = geometry_area or 0
        params = {"area": round(qty, 2)}

    return (round(qty, 4), rule["primary_unit"], params)


def estimate_rebar(element_type: ElementType, concrete_volume: float) -> Tuple[float, str]:
    """Estimate reinforcement steel weight in kg."""
    rates = {
        ElementType.WALL: 80,       # kg/m³
        ElementType.COLUMN: 120,
        ElementType.SLAB: 90,
        ElementType.BEAM: 110,
        ElementType.FOUNDATION: 100,
        ElementType.STAIRS: 70,
        ElementType.ROOF: 85,
    }
    rate = rates.get(element_type, 50)
    return (round(concrete_volume * rate, 2), "كجم")


def _extract_dim_from_text(dims: Dict, key: str) -> Optional[float]:
    """Try to extract dimension from stored text labels or dimension data."""
    text = dims.get("_text_labels", [])
    if isinstance(text, str):
        text = [text]

    for t in text:
        if not isinstance(t, str):
            continue
        patterns = {
            "thickness": [r"(\d+[.,]?\d*)\s*(?:mm|مم|cm|سم|thk|thickness|سماكة|سمك)", r"(?:سمك|سماكة|thk|T|t)\s*[:=]?\s*(\d+[.,]?\d*)"],
            "height": [r"(\d+[.,]?\d*)\s*(?:mm|مم|cm|سم|m|م|height|ارتفاع|علو)", r"(?:ارتفاع|h|height|H|علو)\s*[:=]?\s*(\d+[.,]?\d*)"],
            "width": [r"(\d+[.,]?\d*)\s*(?:mm|مم|cm|سم|m|م|width|عرض)", r"(?:عرض|w|width|W)\s*[:=]?\s*(\d+[.,]?\d*)"],
            "depth": [r"(\d+[.,]?\d*)\s*(?:mm|مم|cm|سم|m|م|depth|عمق)", r"(?:عمق|d|depth|D)\s*[:=]?\s*(\d+[.,]?\d*)"],
            "length": [r"(\d+[.,]?\d*)\s*(?:mm|مم|cm|سم|m|م|length|طول)", r"(?:طول|l|length|L)\s*[:=]?\s*(\d+[.,]?\d*)"],
        }

        for k, pats in patterns.items():
            if k != key:
                continue
            for pat in pats:
                m = re.search(pat, t, re.IGNORECASE)
                if m:
                    val = float(m.group(1).replace(",", "."))
                    return _dim_value_to_meters(val, m.group(0))

    # Check dimension measurement values
    measurement = dims.get("measurement", 0)
    if measurement and key == "length":
        return float(measurement)

    return None


def _dim_value_to_meters(value: float, matched_text: str = "") -> float:
    """Convert a numeric dimension value to meters, honoring explicit units."""
    unit = matched_text.lower()
    if any(u in unit for u in ("mm", "مم")):
        return round(value / 1000, 3)
    if any(u in unit for u in ("cm", "سم")):
        return round(value / 100, 3)
    if any(u in unit for u in ("m", "م")) and not any(u in unit for u in ("mm", "مم", "cm", "سم")):
        return round(value, 3)
    # No explicit unit: heuristic on magnitude
    if value > 100:
        return round(value / 1000, 3)  # mm
    if value > 10:
        return round(value / 100, 3)  # cm
    return round(value, 3)  # meters
