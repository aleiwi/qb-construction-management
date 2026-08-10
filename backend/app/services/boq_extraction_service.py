import math
import re
from typing import List, Tuple, Optional, Dict, Any
from app.models.boq_element import ElementType, ClassificationStatus


LAYER_RULES: List[Tuple[List[str], ElementType]] = [
    (["wall", "walls", "parement", "جدار", "جدران", "حائط", "حوائط", "shearwall", "retaining"], ElementType.WALL),
    (["column", "columns", "col", "cols", "عمود", "أعمدة", "ستود", "ستودز", "pillar", "pillars", "دعامة"], ElementType.COLUMN),
    (["slab", "slabs", "بلاطة", "بلاط", "منسوب", "سقف", "flooring", "floor", "roof slab", "deck", "flat"], ElementType.SLAB),
    (["beam", "beams", "كمرة", "كمرات", "عوارض", "عتب", "عتبات", "girder", "joist", "lintel"], ElementType.BEAM),
    (["foundation", "foundations", "أساس", "أساسات", "footing", "footings", "base", "bases", "mat", "raft", "pile", "strip"], ElementType.FOUNDATION),
    (["door", "doors", "باب", "أبواب", "door_frame", "doorframe"], ElementType.DOOR),
    (["window", "windows", "نافذة", "نوافذ", "window_frame", "windowframe", "glazing", "glz"], ElementType.WINDOW),
    (["stair", "stairs", "staircase", "درج", "درجات", "سلم", "سلالم", "landing", "ramp"], ElementType.STAIRS),
    (["roof", "roofs", "تسقيف", "roofing", "roof tile"], ElementType.ROOF),
    (["partition", "partitionwall", " partition", "حاجز", "فاصل", "drywall", "gypsum", "partition"], ElementType.PARTITION),
    (["opening", "openings", "فتحه", "فتحات", "فتحة", "فتحة", "shaft", "void"], ElementType.OPENING),
]


def classify_layer_name(layer_name: str) -> Tuple[ElementType, ClassificationStatus]:
    normalized = layer_name.lower().strip()
    for keywords, element_type in LAYER_RULES:
        for kw in keywords:
            if kw in normalized or normalized in kw:
                return (element_type, ClassificationStatus.AUTO_CLASSIFIED)
    return (ElementType.OTHER, ClassificationStatus.UNCLASSIFIED)


def extract_elements_from_dxf(dxf_file_path: str) -> List[dict]:
    import ezdxf

    try:
        doc = ezdxf.readfile(dxf_file_path)
    except Exception as e:
        raise ValueError(f"Failed to read DXF file: {e}")

    msp = doc.modelspace()
    elements_by_layer: Dict[str, List[dict]] = {}

    block_defs = {}
    for block in doc.blocks:
        block_defs[block.name] = list(block)

    for entity in msp:
        layer = entity.dxf.layer if hasattr(entity.dxf, 'layer') else "UNKNOWN"
        if layer in ("0", "DEFPOINTS", "POINT", ""):
            continue

        if layer not in elements_by_layer:
            elements_by_layer[layer] = []

        try:
            _process_entity(entity, layer, elements_by_layer, block_defs)
        except Exception:
            pass

    # Also collect MTEXT/TEXT for context — store per layer
    text_by_layer: Dict[str, List[str]] = {}
    for entity in msp:
        layer = entity.dxf.layer if hasattr(entity.dxf, 'layer') else "UNKNOWN"
        if entity.dxftype() == "MTEXT":
            text = entity.text if hasattr(entity, 'text') else entity.dxf.text
            text_by_layer.setdefault(layer, []).append(text)
        elif entity.dxftype() == "TEXT":
            text_by_layer.setdefault(layer, []).append(entity.dxf.text)

    results = []
    for layer_name, entities in elements_by_layer.items():
        if not entities:
            continue

        element_type, status = classify_layer_name(layer_name)

        # Collect nearby text to refine classification when ambiguous
        layer_texts = text_by_layer.get(layer_name, [])

        for e in entities:
            entry = {
                "source_layer_name": layer_name,
                "element_type": element_type,
                "classification_status": status,
                "quantity": round(e.get("quantity", 0), 4),
                "unit": e.get("unit", "م2"),
            }
            if "dimensions" in e:
                entry["dimensions_json"] = e["dimensions"]
            results.append(entry)

        # If the layer had text content, attach it to the last entry metadata
        if layer_texts and results:
            for r in results:
                if "text_labels" not in r:
                    r["text_labels"] = list(set(layer_texts))

    return results


def _process_entity(entity, layer: str, elements_by_layer: Dict[str, List[dict]], block_defs: Dict[str, list]) -> None:
    dxftype = entity.dxftype()

    if dxftype == "LWPOLYLINE":
        _process_lwpolyline(entity, layer, elements_by_layer)

    elif dxftype == "POLYLINE":
        _process_polyline(entity, layer, elements_by_layer)

    elif dxftype == "LINE":
        start = entity.dxf.start
        end = entity.dxf.end
        length = math.sqrt((end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2)
        elements_by_layer[layer].append({
            "type": "LINE",
            "quantity": round(length, 4),
            "unit": "م",
            "dimensions": {"length": round(length, 4), "start": [round(start[0], 4), round(start[1], 4)], "end": [round(end[0], 4), round(end[1], 4)]},
        })

    elif dxftype == "CIRCLE":
        radius = entity.dxf.radius
        area = math.pi * radius * radius
        circ = 2 * math.pi * radius
        elements_by_layer[layer].append({
            "type": "CIRCLE",
            "quantity": round(area, 4),
            "unit": "م2",
            "dimensions": {"radius": round(radius, 4), "circumference": round(circ, 4)},
        })

    elif dxftype == "ARC":
        radius = entity.dxf.radius
        length = _arc_length(entity)
        chord = 2 * radius * math.sin(math.radians(abs(entity.dxf.end_angle - entity.dxf.start_angle) / 2))
        elements_by_layer[layer].append({
            "type": "ARC",
            "quantity": round(length, 4),
            "unit": "م",
            "dimensions": {"radius": round(radius, 4), "length": round(length, 4), "chord": round(chord, 4)},
        })

    elif dxftype == "SPLINE":
        _process_spline(entity, layer, elements_by_layer)

    elif dxftype == "ELLIPSE":
        major_axis = entity.dxf.major_axis
        ratio = entity.dxf.ratio
        a = math.sqrt(major_axis[0]**2 + major_axis[1]**2 + major_axis[2]**2) / 2.0
        b = a * ratio
        area = math.pi * a * b
        elements_by_layer[layer].append({
            "type": "ELLIPSE",
            "quantity": round(area, 4),
            "unit": "م2",
            "dimensions": {"major_axis": round(a, 4), "minor_axis": round(b, 4)},
        })

    elif dxftype in ("MTEXT", "TEXT"):
        # Skip — handled separately for context
        pass

    elif dxftype.startswith("DIMENSION"):
        _process_dimension(entity, layer, elements_by_layer)

    elif dxftype == "INSERT":
        _process_insert(entity, layer, elements_by_layer, block_defs)

    elif dxftype == "HATCH":
        _process_hatch(entity, layer, elements_by_layer)

    else:
        elements_by_layer[layer].append({
            "type": dxftype,
            "quantity": 1.0,
            "unit": "قطة",
            "dimensions": {},
        })


def _process_lwpolyline(entity, layer: str, elements_by_layer: Dict[str, List[dict]]) -> None:
    points = list(entity.get_points())
    if len(points) < 2:
        return

    is_closed = entity.closed
    has_bulge = any(abs(getattr(p, 'bulge', 0)) > 0.001 for p in points)

    if is_closed and len(points) >= 3:
        area = _polygon_area([(p[0], p[1]) for p in points])
        length = _polyline_length(points)
        elements_by_layer[layer].append({
            "type": "LWPOLYLINE",
            "quantity": round(area, 4),
            "unit": "م2",
            "dimensions": {"area": round(area, 4), "perimeter": round(length, 4), "points": len(points), "closed": True, "has_bulge": has_bulge},
        })
    else:
        length = _polyline_length(points)
        elements_by_layer[layer].append({
            "type": "LWPOLYLINE",
            "quantity": round(length, 4),
            "unit": "م",
            "dimensions": {"length": round(length, 4), "points": len(points), "closed": False, "has_bulge": has_bulge},
        })


def _process_polyline(entity, layer: str, elements_by_layer: Dict[str, List[dict]]) -> None:
    try:
        points = list(entity.points())
    except Exception:
        points = list(entity.vertices) if hasattr(entity, 'vertices') else []

    if len(points) < 2:
        return

    is_closed = entity.is_closed if hasattr(entity, 'is_closed') else False

    if is_closed and len(points) >= 3:
        area = _polygon_area([(p[0], p[1]) for p in points])
        length = _polyline_length(points)
        elements_by_layer[layer].append({
            "type": "POLYLINE",
            "quantity": round(area, 4),
            "unit": "م2",
            "dimensions": {"area": round(area, 4), "perimeter": round(length, 4), "points": len(points), "closed": True},
        })
    else:
        length = _polyline_length(points)
        elements_by_layer[layer].append({
            "type": "POLYLINE",
            "quantity": round(length, 4),
            "unit": "م",
            "dimensions": {"length": round(length, 4), "points": len(points), "closed": False},
        })


def _process_spline(entity, layer: str, elements_by_layer: Dict[str, List[dict]]) -> None:
    try:
        control_points = list(entity.control_points)
    except Exception:
        control_points = []

    try:
        fit_points = list(entity.fit_points)
    except Exception:
        fit_points = []

    pts = fit_points if len(fit_points) >= 3 else control_points
    if len(pts) < 3:
        # Use evaluated points via ezdxf path
        try:
            from ezdxf import path
            p = path.from_vertices(entity)
            pts = list(p.approximate(segments=32))
        except Exception:
            pts = control_points

    if len(pts) >= 3:
        area = _polygon_area([(p[0], p[1]) for p in pts])
        length = _polyline_length(pts)
        elements_by_layer[layer].append({
            "type": "SPLINE",
            "quantity": round(area, 4),
            "unit": "م2",
            "dimensions": {"area": round(area, 4), "length": round(length, 4), "fit_points": len(fit_points), "control_points": len(control_points)},
        })
    elif len(pts) >= 2:
        length = _polyline_length(pts)
        elements_by_layer[layer].append({
            "type": "SPLINE",
            "quantity": round(length, 4),
            "unit": "م",
            "dimensions": {"length": round(length, 4), "control_points": len(control_points)},
        })


def _process_dimension(entity, layer: str, elements_by_layer: Dict[str, List[dict]]) -> None:
    try:
        measurement = entity.dxf.measurement if hasattr(entity.dxf, 'measurement') else None
    except Exception:
        measurement = None

    if measurement is None or measurement == 0:
        return

    dim_type = entity.dxftype()
    if dim_type in ("DIMLINEAR", "DIMALIGNED", "DIMROTATED"):
        unit = "م"
    elif dim_type in ("DIMRADIUS", "DIMDIAMETER"):
        unit = "م"
    elif dim_type == "DIMANGULAR":
        unit = "°"
    else:
        unit = "م"

    elements_by_layer[layer].append({
        "type": dim_type,
        "quantity": round(measurement, 4),
        "unit": unit,
        "dimensions": {"measurement": round(measurement, 4), "dim_type": dim_type},
    })


def _process_insert(entity, layer: str, elements_by_layer: Dict[str, List[dict]], block_defs: Dict[str, list]) -> None:
    block_name = entity.dxf.name if hasattr(entity.dxf, 'name') else None
    if not block_name or block_name not in block_defs:
        elements_by_layer[layer].append({
            "type": "INSERT",
            "quantity": 1.0,
            "unit": "قطة",
            "dimensions": {"block": block_name or "unknown"},
        })
        return

    # Recursively process entities inside the block definition
    inner_entities = block_defs[block_name]
    for inner_entity in inner_entities:
        # Apply INSERT transformation (scale, rotation, position)
        inner_layer = inner_entity.dxf.layer if hasattr(inner_entity.dxf, 'layer') else layer
        if inner_layer in ("0", "DEFPOINTS", ""):
            inner_layer = layer

        if inner_layer not in elements_by_layer:
            elements_by_layer[inner_layer] = []

        try:
            _process_entity(inner_entity, inner_layer, elements_by_layer, block_defs)
        except Exception:
            pass


def _process_hatch(entity, layer: str, elements_by_layer: Dict[str, List[dict]]) -> None:
    total_area = 0.0
    try:
        for path in entity.paths:
            if hasattr(path, 'vertices') and len(path.vertices) >= 3:
                pts = [(v[0], v[1]) for v in path.vertices]
                total_area += _polygon_area(pts)
            elif hasattr(path, 'edges'):
                for edge in path.edges:
                    if hasattr(edge, 'control_points') and len(edge.control_points) >= 3:
                        pts = [(p[0], p[1]) for p in edge.control_points]
                        total_area += _polygon_area(pts)
    except Exception:
        pass

    if total_area > 0:
        elements_by_layer[layer].append({
            "type": "HATCH",
            "quantity": round(total_area, 4),
            "unit": "م2",
            "dimensions": {"area": round(total_area, 4)},
        })


def _polygon_area(points: List) -> float:
    if len(points) < 3:
        return 0.0
    area = 0.0
    n = len(points)
    for i in range(n):
        j = (i + 1) % n
        xi = float(points[i][0])
        yi = float(points[i][1])
        xj = float(points[j][0])
        yj = float(points[j][1])
        area += xi * yj - xj * yi
    return abs(area) / 2.0


def _polyline_length(points: List) -> float:
    length = 0.0
    for i in range(len(points) - 1):
        dx = float(points[i + 1][0]) - float(points[i][0])
        dy = float(points[i + 1][1]) - float(points[i][1])
        length += math.sqrt(dx * dx + dy * dy)
    return length


def _arc_length(entity) -> float:
    try:
        start = entity.dxf.start_angle
        end = entity.dxf.end_angle
        angle = abs(end - start)
        if angle > 180:
            angle = 360 - angle
        return float(entity.dxf.radius) * float(angle) * math.pi / 180.0
    except Exception:
        return 0.0
