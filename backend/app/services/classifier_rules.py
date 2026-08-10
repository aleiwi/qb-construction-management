import re
from typing import Tuple, Optional, Dict, List
from app.models.boq_element import ElementType, ClassificationStatus


class RuleMatch:
    __slots__ = ("element_type", "confidence", "reason")
    def __init__(self, element_type: ElementType, confidence: float, reason: str):
        self.element_type = element_type
        self.confidence = confidence
        self.reason = reason


def classify(context: dict) -> Optional[RuleMatch]:
    layer = context.get("layer_name", "").lower().strip()
    text_labels = [t.lower() for t in context.get("text_labels", [])]
    geometry_type = context.get("geometry_type", "").upper()
    dims = context.get("dimensions", {})

    # Priority 1: Exact layer name matches (high confidence)
    exact_match = _exact_layer_match(layer)
    if exact_match:
        return exact_match

    # Priority 2: Keyword matching on layer name
    keyword_match = _keyword_layer_match(layer)
    if keyword_match:
        return keyword_match

    # Priority 3: Text label analysis
    text_match = _text_label_match(text_labels)
    if text_match:
        return text_match

    # Priority 4: Geometry-based heuristic
    geo_match = _geometry_match(geometry_type, dims)
    if geo_match:
        return geo_match

    return None


def _exact_layer_match(layer: str) -> Optional[RuleMatch]:
    EXACT_RULES: Dict[str, Tuple[ElementType, float]] = {
        # Walls
        "a-wall": (ElementType.WALL, 0.95), "a-walls": (ElementType.WALL, 0.95),
        "wall": (ElementType.WALL, 0.90), "walls": (ElementType.WALL, 0.90),
        "shearwall": (ElementType.WALL, 0.95), "shear wall": (ElementType.WALL, 0.95),
        "retaining wall": (ElementType.WALL, 0.90), "ret-wall": (ElementType.WALL, 0.90),
        "c wall": (ElementType.WALL, 0.80), "c-walls": (ElementType.WALL, 0.80),
        "curtain wall": (ElementType.WALL, 0.85),
        # Columns
        "column": (ElementType.COLUMN, 0.90), "columns": (ElementType.COLUMN, 0.90),
        "col": (ElementType.COLUMN, 0.85), "cols": (ElementType.COLUMN, 0.85),
        "rcc column": (ElementType.COLUMN, 0.95), "rccol": (ElementType.COLUMN, 0.90),
        "pillar": (ElementType.COLUMN, 0.85), "pillars": (ElementType.COLUMN, 0.85),
        "a-column": (ElementType.COLUMN, 0.90),
        # Slabs
        "slab": (ElementType.SLAB, 0.90), "slabs": (ElementType.SLAB, 0.90),
        "rcc slab": (ElementType.SLAB, 0.95), "rccslab": (ElementType.SLAB, 0.90),
        "floor slab": (ElementType.SLAB, 0.90), "roof slab": (ElementType.SLAB, 0.90),
        "deck slab": (ElementType.SLAB, 0.90), "flat slab": (ElementType.SLAB, 0.90),
        "a-slab": (ElementType.SLAB, 0.90), "sog": (ElementType.SLAB, 0.80),
        "structural slab": (ElementType.SLAB, 0.95),
        # Beams
        "beam": (ElementType.BEAM, 0.90), "beams": (ElementType.BEAM, 0.90),
        "rcc beam": (ElementType.BEAM, 0.95), "rccbeam": (ElementType.BEAM, 0.90),
        "grade beam": (ElementType.BEAM, 0.90), "tie beam": (ElementType.BEAM, 0.90),
        "plinth beam": (ElementType.BEAM, 0.90), "ring beam": (ElementType.BEAM, 0.90),
        "lintel": (ElementType.BEAM, 0.85), "lintels": (ElementType.BEAM, 0.85),
        "girder": (ElementType.BEAM, 0.85), "girders": (ElementType.BEAM, 0.85),
        "joist": (ElementType.BEAM, 0.80), "joists": (ElementType.BEAM, 0.80),
        "a-beam": (ElementType.BEAM, 0.90),
        # Foundations
        "foundation": (ElementType.FOUNDATION, 0.90), "foundations": (ElementType.FOUNDATION, 0.90),
        "footing": (ElementType.FOUNDATION, 0.90), "footings": (ElementType.FOUNDATION, 0.90),
        "isolated footing": (ElementType.FOUNDATION, 0.95), "strip footing": (ElementType.FOUNDATION, 0.95),
        "raft foundation": (ElementType.FOUNDATION, 0.95), "mat foundation": (ElementType.FOUNDATION, 0.95),
        "pile cap": (ElementType.FOUNDATION, 0.90), "pilecaps": (ElementType.FOUNDATION, 0.90),
        "piles": (ElementType.FOUNDATION, 0.85), "pile": (ElementType.FOUNDATION, 0.80),
        "a-foundation": (ElementType.FOUNDATION, 0.90), "fnd": (ElementType.FOUNDATION, 0.85),
        # Doors
        "door": (ElementType.DOOR, 0.85), "doors": (ElementType.DOOR, 0.85),
        "door frame": (ElementType.DOOR, 0.80), "doorframe": (ElementType.DOOR, 0.80),
        "opening-doors": (ElementType.DOOR, 0.80),
        # Windows
        "window": (ElementType.WINDOW, 0.85), "windows": (ElementType.WINDOW, 0.85),
        "window frame": (ElementType.WINDOW, 0.80), "windowframe": (ElementType.WINDOW, 0.80),
        "glazing": (ElementType.WINDOW, 0.80), "glz": (ElementType.WINDOW, 0.75),
        "opening-windows": (ElementType.WINDOW, 0.80),
        # Stairs
        "stair": (ElementType.STAIRS, 0.90), "stairs": (ElementType.STAIRS, 0.90),
        "staircase": (ElementType.STAIRS, 0.95), "landing": (ElementType.STAIRS, 0.80),
        "ramp": (ElementType.STAIRS, 0.75),
        # Roof
        "roof": (ElementType.ROOF, 0.80), "roofing": (ElementType.ROOF, 0.80),
        "roof tile": (ElementType.ROOF, 0.80),
        # Partitions
        "partition": (ElementType.PARTITION, 0.85), "partitions": (ElementType.PARTITION, 0.85),
        "drywall": (ElementType.PARTITION, 0.85), "gypsum": (ElementType.PARTITION, 0.80),
        "gypboard": (ElementType.PARTITION, 0.80),
        # Openings
        "opening": (ElementType.OPENING, 0.75), "openings": (ElementType.OPENING, 0.75),
        "shaft": (ElementType.OPENING, 0.75), "void": (ElementType.OPENING, 0.75),
        "duct opening": (ElementType.OPENING, 0.80),
    }
    if layer in EXACT_RULES:
        et, conf = EXACT_RULES[layer]
        return RuleMatch(et, conf, f"exact layer name: {layer}")


def _keyword_layer_match(layer: str) -> Optional[RuleMatch]:
    KEYWORD_RULES: List[Tuple[re.Pattern, ElementType, float, str]] = [
        (re.compile(r"wall|جدار|جدران|حائط|حوائط|parement", re.IGNORECASE), ElementType.WALL, 0.80, "keyword: wall"),
        (re.compile(r"column|عمود|أعمدة|ستود|دعامة|pillar", re.IGNORECASE), ElementType.COLUMN, 0.80, "keyword: column"),
        (re.compile(r"slab|بلاطة|بلاط|منسوب|flooring|deck|flat", re.IGNORECASE), ElementType.SLAB, 0.75, "keyword: slab"),
        (re.compile(r"beam|كمرة|كمرات|عوارض|عتب|girder|joist|lintel", re.IGNORECASE), ElementType.BEAM, 0.80, "keyword: beam"),
        (re.compile(r"foundation|أساس|footing|pile|raft|mat", re.IGNORECASE), ElementType.FOUNDATION, 0.80, "keyword: foundation"),
        (re.compile(r"door|باب|أبواب", re.IGNORECASE), ElementType.DOOR, 0.75, "keyword: door"),
        (re.compile(r"window|نافذة|نوافذ|glazing|glz", re.IGNORECASE), ElementType.WINDOW, 0.75, "keyword: window"),
        (re.compile(r"stair|درج|سلم|سلالم|ramp|landing", re.IGNORECASE), ElementType.STAIRS, 0.80, "keyword: stairs"),
        (re.compile(r"roof|تسقيف|roofing", re.IGNORECASE), ElementType.ROOF, 0.70, "keyword: roof"),
        (re.compile(r"partition|حاجز|فاصل|drywall|gypsum|gypboard", re.IGNORECASE), ElementType.PARTITION, 0.75, "keyword: partition"),
        (re.compile(r"opening|فتحه|فتحات|فتحة|shaft|void", re.IGNORECASE), ElementType.OPENING, 0.70, "keyword: opening"),
        # Arabic construction layer prefixes
        (re.compile(r"^(arch|arc|a-|a )", re.IGNORECASE), ElementType.WALL, 0.50, "arch layer"),
        (re.compile(r"^(struc|str|s-|s )", re.IGNORECASE), ElementType.COLUMN, 0.50, "structural layer"),
        (re.compile(r"^(elec|e-|e )", re.IGNORECASE), ElementType.OTHER, 0.30, "electrical layer"),
        (re.compile(r"^(mep|m-|m )", re.IGNORECASE), ElementType.OTHER, 0.30, "MEP layer"),
        (re.compile(r"^(plumb|p-|p )", re.IGNORECASE), ElementType.OTHER, 0.30, "plumbing layer"),
        (re.compile(r"(dim|dimension| annot|text|label|tag)", re.IGNORECASE), ElementType.OTHER, 0.40, "annotation layer"),
        (re.compile(r"(grid|axis|level|标高)", re.IGNORECASE), ElementType.OTHER, 0.40, "reference layer"),
    ]

    for pattern, et, conf, reason in KEYWORD_RULES:
        if pattern.search(layer):
            return RuleMatch(et, conf, reason)

    return None


def _text_label_match(texts: List[str]) -> Optional[RuleMatch]:
    TEXT_RULES: List[Tuple[re.Pattern, ElementType, float, str]] = [
        (re.compile(r"^(wall|جدار)", re.IGNORECASE), ElementType.WALL, 0.70, "text: wall"),
        (re.compile(r"^(col|column|عمود)", re.IGNORECASE), ElementType.COLUMN, 0.70, "text: column"),
        (re.compile(r"^(slab|بلاطة|s\b)", re.IGNORECASE), ElementType.SLAB, 0.65, "text: slab"),
        (re.compile(r"^(beam|b\b|كمرة)", re.IGNORECASE), ElementType.BEAM, 0.70, "text: beam"),
        (re.compile(r"^(fnd|foot|foundation|أساس)", re.IGNORECASE), ElementType.FOUNDATION, 0.70, "text: foundation"),
        (re.compile(r"^(d\b|door|باب)", re.IGNORECASE), ElementType.DOOR, 0.65, "text: door"),
        (re.compile(r"^(w\b|win|window|نافذة)", re.IGNORECASE), ElementType.WINDOW, 0.65, "text: window"),
        (re.compile(r"^(stair|درج|ramp)", re.IGNORECASE), ElementType.STAIRS, 0.70, "text: stairs"),
        (re.compile(r"^(part|partition|حاجز)", re.IGNORECASE), ElementType.PARTITION, 0.65, "text: partition"),
        (re.compile(r"^(open|فتحة|void)", re.IGNORECASE), ElementType.OPENING, 0.60, "text: opening"),
    ]

    for text in texts:
        for pattern, et, conf, reason in TEXT_RULES:
            if pattern.search(text):
                return RuleMatch(et, conf, reason)
    return None


def _geometry_match(geometry_type: str, dims: dict) -> Optional[RuleMatch]:
    area = dims.get("area", 0) or dims.get("quantity", 0) or 0
    length = dims.get("length", 0) or 0
    radius = dims.get("radius", 0) or 0

    # Large circular areas → likely columns or foundations
    if geometry_type in ("CIRCLE", "ELLIPSE") and area > 0:
        if area < 2.0:
            return RuleMatch(ElementType.COLUMN, 0.55, "small circle → column")
        return RuleMatch(ElementType.FOUNDATION, 0.50, "large circle → foundation")

    # Long linear elements → walls or beams
    if geometry_type in ("LINE", "ARC") and length > 0:
        if length > 5.0:
            return RuleMatch(ElementType.WALL, 0.45, "long line → wall")
        return RuleMatch(ElementType.BEAM, 0.40, "short line → beam")

    # Large polygonal areas → slabs or roofs
    if geometry_type in ("LWPOLYLINE, POLYLINE, SPLINE") and area > 10.0:
        return RuleMatch(ElementType.SLAB, 0.50, "large polygon → slab")

    return None
