import math
import re
from typing import List, Tuple, Optional, Dict, Any
from app.models.boq_element import ElementType, ClassificationStatus


LAYER_RULES: List[Tuple[List[str], ElementType]] = [
    (["wall", "walls", "parement", "جدار", "جدران", "حائط", "حوائط", "shearwall", "retaining",
      "a21", "a22", "a24"], ElementType.WALL),
    (["column", "columns", "col", "cols", "عمود", "أعمدة", "ستود", "ستودز", "pillar", "pillars", "دعامة"], ElementType.COLUMN),
    (["slab", "slabs", "بلاطة", "بلاط", "منسوب", "سقف", "flooring", "floor", "deck", "flat"], ElementType.SLAB),
    (["beam", "beams", "header", "headers", "كمرة", "كمرات", "عوارض", "عتب", "عتبات", "girder", "joist", "lintel"], ElementType.BEAM),
    (["foundation", "foundations", "fnd", "fnds", "footer", "footers", "أساس", "أساسات", "footing", "footings", "base", "bases", "mat", "raft", "pile", "strip"], ElementType.FOUNDATION),
    (["door", "doors", "باب", "أبواب", "door_frame", "doorframe", "a31"], ElementType.DOOR),
    (["window", "windows", "win", "نافذة", "نوافذ", "window_frame", "windowframe", "glazing", "glz", "a32"], ElementType.WINDOW),
    (["stair", "stairs", "staircase", "درج", "درجات", "سلم", "سلالم", "landing", "ramp", "a40", "a41"], ElementType.STAIRS),
    (["roof", "roofs", "تسقيف", "roofing", "roof tile", "a52"], ElementType.ROOF),
    (["partition", "partitionwall", " partition", "حاجز", "فاصل", "drywall", "gypsum", "partition"], ElementType.PARTITION),
    (["opening", "openings", "فتحه", "فتحات", "فتحة", "فتحة", "shaft", "void"], ElementType.OPENING),
]

# ج4: طبقات دقيقة تُفحص قبل الكلمات المفتاحية (تمنع "drywall" → wall)
EXACT_LAYER_MAP: Dict[str, ElementType] = {
    "drywall": ElementType.PARTITION,
    "gypsum": ElementType.PARTITION,
    "gypboard": ElementType.PARTITION,
    "shearwall": ElementType.WALL,
    "retaining": ElementType.WALL,
    "roof slab": ElementType.SLAB,
    "doorframe": ElementType.DOOR,
    "windowframe": ElementType.WINDOW,
}


def classify_layer_name(layer_name: str) -> Tuple[ElementType, ClassificationStatus]:
    normalized = layer_name.lower().strip()
    if normalized in EXACT_LAYER_MAP:
        return (EXACT_LAYER_MAP[normalized], ClassificationStatus.AUTO_CLASSIFIED)
    for keywords, element_type in LAYER_RULES:
        for kw in keywords:
            if kw in normalized:
                return (element_type, ClassificationStatus.AUTO_CLASSIFIED)
            # ج4: تطابق عكسي (normalized in kw) فقط عندما تكون الكلمة المستهدفة
            # قصيرة (مثل "part" في "partition") لمنع التصادم العكسي.
            if len(normalized) <= 4 and normalized in kw:
                return (element_type, ClassificationStatus.AUTO_CLASSIFIED)
    return (ElementType.OTHER, ClassificationStatus.UNCLASSIFIED)


def _unit_scale(doc) -> float:
    """ج5: معامل تحويل وحدات الرسم إلى أمتار (يعتمد على doc.units)."""
    try:
        units = doc.units
    except Exception:
        units = 0
    scale = {
        1: 0.0254,    # inch
        2: 0.3048,    # feet
        3: 0.9144,    # yards
        4: 0.001,     # mm
        5: 0.01,      # cm
        6: 1.0,       # m
        20: 1e-6,     # µm
    }.get(units, 1.0)
    return scale


_LINEAR_DIM_KEYS = ("length", "width", "height", "depth", "thickness", "radius", "diameter",
                    "bbox_width", "bbox_height", "perimeter", "dim_length", "dim_thickness",
                    "dim_width", "dim_depth", "measurement")


def _scale_element(entry: dict, scale: float) -> None:
    """يحوّل كمية وأبعاد عنصر من وحدات الرسم إلى أمتار."""
    if scale == 1.0:
        return
    unit = entry.get("unit", "م2")
    entry["quantity"] = round(entry.get("quantity", 0) * (scale ** (2 if unit == "م2" else 1)), 6)
    dims = entry.get("dimensions_json")
    if not dims:
        return
    for k in ("area", "area_calc"):
        if k in dims:
            dims[k] = round(dims[k] * scale * scale, 6)
    for k in _LINEAR_DIM_KEYS:
        if k in dims:
            dims[k] = round(dims[k] * scale, 6)
    for k in ("origin_min", "origin_max", "start", "end"):
        if k in dims:
            dims[k] = [round(v * scale, 6) for v in dims[k]]


def extract_elements_from_dxf(dxf_file_path: str) -> List[dict]:
    import ezdxf

    try:
        doc = ezdxf.readfile(dxf_file_path)
    except Exception as e:
        raise ValueError(f"Failed to read DXF file: {e}")

    msp = doc.modelspace()
    elements_by_layer: Dict[str, List[dict]] = {}
    all_dims: List[dict] = []
    scale = _unit_scale(doc)

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
            _process_entity(entity, layer, elements_by_layer, block_defs, all_dims)
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

        # ج2: ادمج الخطوط المفتوحة المتصلة في مضلعات/متعددات خطوط
        standalone_lines = []
        others = []
        for e in entities:
            if e.get("type") == "LINE":
                standalone_lines.append(e)
            else:
                others.append(e)
        chained = _chain_lines_into_polylines(standalone_lines) if standalone_lines else []
        entities = others + chained

        element_type, status = classify_layer_name(layer_name)

        # Collect nearby text to refine classification when ambiguous
        layer_texts = text_by_layer.get(layer_name, [])

        layer_results = []
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
            layer_results.append(entry)

        # If the layer had text content, attach it to that layer's elements only
        if layer_texts:
            labels = list(set(layer_texts))
            for r in layer_results:
                r["text_labels"] = labels
                dims = r.get("dimensions_json") or {}
                dims["_text_labels"] = labels
                r["dimensions_json"] = dims

        for r in layer_results:
            _scale_element(r, scale)
            dims = r.setdefault("dimensions_json", {})
            dims["unit_scale"] = scale

        results.extend(layer_results)

    # ج5: ربط أبعاد DIMENSION المكانية بالعناصر القريبة
    for d in all_dims:
        d["value"] = round(d["value"] * scale, 6)
        d["midpoint"] = [round(v * scale, 6) for v in d["midpoint"]]
    _link_dimensions_to_elements(results, all_dims)
    _deduct_openings_from_walls(results)

    return results


def _process_entity(entity, layer: str, elements_by_layer: Dict[str, List[dict]], block_defs: Dict[str, list], all_dims: List[dict] = None) -> None:
    dxftype = entity.dxftype()
    all_dims = all_dims if all_dims is not None else []

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
            "start": (float(start[0]), float(start[1])),
            "end": (float(end[0]), float(end[1])),
            "length": round(length, 4),
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
        _process_dimension(entity, layer, elements_by_layer, all_dims)

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


def _bbox_dims(points: List) -> Dict[str, float]:
    """أبعاد المستطيل المحيط (bounding box) — للتمييز بين الطول والسماكة + الموقع."""
    if not points:
        return {}
    xs = [float(p[0]) for p in points]
    ys = [float(p[1]) for p in points]
    w = max(xs) - min(xs)
    h = max(ys) - min(ys)
    return {"bbox_width": round(w, 4), "bbox_height": round(h, 4),
            "origin_min": [round(min(xs), 4), round(min(ys), 4)],
            "origin_max": [round(max(xs), 4), round(max(ys), 4)]}


_TOLERANCE = 1e-3


def _dist(p1, p2) -> float:
    return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)


def _chain_lines_into_polylines(lines: List[dict]) -> List[dict]:
    """ج2: يجمع الخطوط المفتوحة المتصلة الأطراف في مضلعات/متعددات خطوط.

    الخطوط التي تلتقي endpoints (بتسامح 1مم) تُدمج في كيان واحد.
    يعيد قائمة كيانات بالصيغة نفسها المستخدمة للـ polyline.
    """
    # كل خط: {'start': (x,y), 'end': (x,y), 'dims': {...}}
    remaining = [{"start": l["start"], "end": l["end"], "dims": l.get("dimensions", {}), "length": l.get("length", l.get("quantity", 0))} for l in lines]
    chains: List[List[dict]] = []

    while remaining:
        current = remaining.pop(0)
        chain = [current]
        changed = True
        while changed:
            changed = False
            chain_start = chain[0]["start"]
            chain_end = chain[-1]["end"]
            for idx, cand in enumerate(remaining):
                if _dist(chain_end, cand["start"]) <= _TOLERANCE:
                    chain.append(cand)
                    remaining.pop(idx)
                    changed = True
                    break
                if _dist(chain_end, cand["end"]) <= _TOLERANCE:
                    cand["start"], cand["end"] = cand["end"], cand["start"]
                    chain.append(cand)
                    remaining.pop(idx)
                    changed = True
                    break
                if _dist(chain_start, cand["end"]) <= _TOLERANCE:
                    chain.insert(0, cand)
                    remaining.pop(idx)
                    changed = True
                    break
                if _dist(chain_start, cand["start"]) <= _TOLERANCE:
                    cand["start"], cand["end"] = cand["end"], cand["start"]
                    chain.insert(0, cand)
                    remaining.pop(idx)
                    changed = True
                    break
        chains.append(chain)

    results = []
    for chain in chains:
        if len(chain) == 1:
            # خط منفرد: أبعاده كما هي
            results.append({"type": "LINE", "quantity": chain[0]["length"], "unit": "م",
                            "dimensions": chain[0]["dims"]})
            continue

        # بناء نقاط متسلسلة
        pts = [chain[0]["start"]]
        for seg in chain:
            pts.append(seg["end"])

        is_closed = _dist(pts[0], pts[-1]) <= _TOLERANCE
        if is_closed and len(pts) >= 4:
            pts = pts[:-1]  # أزل نقطة الإغلاق المكررة
        length = _polyline_length(pts)
        bbox = _bbox_dims(pts)

        if is_closed and len(pts) >= 3:
            area = _polygon_area(pts)
            results.append({
                "type": "LWPOLYLINE",
                "quantity": round(area, 4),
                "unit": "م2",
                "dimensions": {"area": round(area, 4), "perimeter": round(length, 4),
                               "points": len(pts), "closed": True, "chained": True, **bbox},
            })
        else:
            results.append({
                "type": "LWPOLYLINE",
                "quantity": round(length, 4),
                "unit": "م",
                "dimensions": {"length": round(length, 4), "points": len(pts),
                               "closed": False, "chained": True, **bbox},
            })
    return results


def _process_lwpolyline(entity, layer: str, elements_by_layer: Dict[str, List[dict]]) -> None:
    points = list(entity.get_points())
    if len(points) < 2:
        return

    is_closed = entity.closed
    has_bulge = any(abs(getattr(p, 'bulge', 0)) > 0.001 for p in points)

    if is_closed and len(points) >= 3:
        area = _polygon_area([(p[0], p[1]) for p in points])
        length = _polyline_length(points)
        bbox = _bbox_dims(points)
        elements_by_layer[layer].append({
            "type": "LWPOLYLINE",
            "quantity": round(area, 4),
            "unit": "م2",
            "dimensions": {"area": round(area, 4), "perimeter": round(length, 4), "points": len(points), "closed": True, "has_bulge": has_bulge, **bbox},
        })
    else:
        length = _polyline_length(points)
        bbox = _bbox_dims(points)
        elements_by_layer[layer].append({
            "type": "LWPOLYLINE",
            "quantity": round(length, 4),
            "unit": "م",
            "dimensions": {"length": round(length, 4), "points": len(points), "closed": False, "has_bulge": has_bulge, **bbox},
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
        bbox = _bbox_dims(points)
        elements_by_layer[layer].append({
            "type": "POLYLINE",
            "quantity": round(area, 4),
            "unit": "م2",
            "dimensions": {"area": round(area, 4), "perimeter": round(length, 4), "points": len(points), "closed": True, **bbox},
        })
    else:
        length = _polyline_length(points)
        bbox = _bbox_dims(points)
        elements_by_layer[layer].append({
            "type": "POLYLINE",
            "quantity": round(length, 4),
            "unit": "م",
            "dimensions": {"length": round(length, 4), "points": len(points), "closed": False, **bbox},
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


def _process_dimension(entity, layer: str, elements_by_layer: Dict[str, List[dict]], all_dims: List[dict]) -> None:
    measurement = None
    try:
        if hasattr(entity.dxf, 'measurement'):
            measurement = entity.dxf.measurement
    except Exception:
        measurement = None
    if measurement in (None, 0) and hasattr(entity, "get_measurement"):
        try:
            measurement = entity.get_measurement()
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

    # الموقع الأوسط للقياس (لربطه لاحقًا بالعنصر القريب)
    midpoint = None
    try:
        if hasattr(entity.dxf, "text_midpoint"):
            mp = entity.dxf.text_midpoint
            midpoint = [float(mp[0]), float(mp[1])]
        elif hasattr(entity.dxf, "defpoint") and hasattr(entity.dxf, "defpoint3"):
            p1, p3 = entity.dxf.defpoint, entity.dxf.defpoint3
            midpoint = [(float(p1[0]) + float(p3[0])) / 2, (float(p1[1]) + float(p3[1])) / 2]
    except Exception:
        midpoint = None

    if midpoint:
        all_dims.append({"value": round(measurement, 4), "midpoint": midpoint, "dim_type": dim_type})

    elements_by_layer[layer].append({
        "type": dim_type,
        "quantity": round(measurement, 4),
        "unit": unit,
        "dimensions": {"measurement": round(measurement, 4), "dim_type": dim_type},
    })


def _link_dimensions_to_elements(results: List[dict], all_dims: List[dict]) -> None:
    """ج5: يربط أبعاد DIMENSION المكانية بالعناصر القريبة ويخزنها في dimensions.

    القاعدة: أقرب قياس (ضمن 3م من مركز العنصر) الذي تتطابق قيمته مع أحد
    أبعاد bbox للعنصر يُعتبر بُعدًا حقيقيًا (dim_length/dim_thickness/...).
    """
    if not all_dims:
        return

    linear = [d for d in all_dims if d["dim_type"] in ("DIMLINEAR", "DIMALIGNED", "DIMROTATED", "DIMENSION")]

    for r in results:
        dims = r.get("dimensions_json") or {}
        o_min = dims.get("origin_min")
        o_max = dims.get("origin_max")
        if not o_min or not o_max:
            continue
        bw = dims.get("bbox_width", 0) or 0
        bh = dims.get("bbox_height", 0) or 0
        cx, cy = (o_min[0] + o_max[0]) / 2, (o_min[1] + o_max[1]) / 2

        for d in linear:
            mx, my = d["midpoint"]
            if abs(mx - cx) > 3.0 or abs(my - cy) > 3.0:
                continue
            value = d["value"]
            if bw <= 0 and bh <= 0:
                continue
            # مطابقة القيمة مع أبعاد bbox (تسامح 2%)
            long_side, short_side = max(bw, bh), min(bw, bh)
            if long_side > 0 and abs(value - long_side) / long_side <= 0.02:
                dims["dim_length"] = round(value, 4)
                dims["dim_source"] = "DIMENSION"
            elif short_side > 0 and abs(value - short_side) / short_side <= 0.02:
                dims["dim_thickness"] = round(value, 4)
                dims["dim_source"] = "DIMENSION"
            elif short_side > 0 and value < short_side:
                dims["dim_thickness"] = round(value, 4)
                dims["dim_source"] = "DIMENSION"
        r["dimensions_json"] = dims


# ج6: ارتفاعات افتراضية للفتحات عندما لا يوجد نص H= (بالمتر)
_OPENING_DEFAULT_HEIGHTS = {
    "door": 2.1,
    "window": 1.5,
    "opening": 2.0,
}


def _num(value) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _element_center(dims: Dict) -> Optional[Tuple[float, float]]:
    """مركز العنصر من bbox أو من نقاط خط."""
    o_min = dims.get("origin_min")
    o_max = dims.get("origin_max")
    if o_min and o_max:
        return ((o_min[0] + o_max[0]) / 2, (o_min[1] + o_max[1]) / 2)
    s = dims.get("start")
    e = dims.get("end")
    if s and e:
        return ((s[0] + e[0]) / 2, (s[1] + e[1]) / 2)
    return None


def _deduct_openings_from_walls(results: List[dict]) -> None:
    """ج6: يخصم فتحات الأبواب/النوافذ من الجدران التي تقع بداخلها.

    لكل جدار (له bbox) نبحث عن عناصر فتحات (باب/نافذة/فتحة) يقع مركزها
    داخل المستطيل المحيط للجدار (بتسامح 0.5م)، ونُخزن مساحة الواجهة
    (عرض × ارتفاع) في opening_deduction_m2 ليخصمها محرك الكميات.

    عرض الفتحة = البُعد الموازي لطول الجدار. للفتحات المرسومة كمستطيلات
    نشترط أن يغطي بُعدها العمودي السماكة تقريبًا (وإلا فهي رمز وليست فتحة)؛
    أما الفتحات المرسومة كخطوط فهي دائمًا فتحات بعرض = طول الخط.
    """
    walls = []
    openings = []
    for r in results:
        et = r.get("element_type")
        et_val = et.value if hasattr(et, "value") else str(et)
        dims = r.get("dimensions_json") or {}
        if et_val == "wall" and dims.get("origin_min") and dims.get("origin_max"):
            walls.append(r)
        elif et_val in ("door", "window", "opening"):
            center = _element_center(dims)
            if center:
                openings.append({"element": r, "center": center, "used": False})

    for wall in walls:
        dims = wall.setdefault("dimensions_json", {})
        o_min, o_max = dims["origin_min"], dims["origin_max"]
        wall_bw = _num(dims.get("bbox_width", 0))
        wall_bh = _num(dims.get("bbox_height", 0))
        wall_thk = min(wall_bw, wall_bh) or _num(dims.get("dim_thickness", 0))
        horizontal = wall_bw >= wall_bh  # طول الجدار على محور X
        total = 0.0
        for op in openings:
            if op["used"]:
                continue
            cx, cy = op["center"]
            if not (o_min[0] - 0.5 <= cx <= o_max[0] + 0.5 and o_min[1] - 0.5 <= cy <= o_max[1] + 0.5):
                continue
            od = op["element"].get("dimensions_json") or {}
            obw = _num(od.get("bbox_width", 0))
            obh = _num(od.get("bbox_height", 0))
            olen = _num(od.get("length", 0))
            if obw > 0 and obh > 0:
                # مستطيل: العرض = البُعد الموازي لطول الجدار
                along = obw if horizontal else obh
                across = obh if horizontal else obw
                # يجب أن يغطي البُعد العمودي سماكة الجدار تقريبًا (بحد 4×)
                if wall_thk > 0 and across > wall_thk * 4 + 0.1:
                    continue  # رمز باب/نافذة وليس فتحة في الجدار
                width = along
            else:
                width = olen  # فتحة مرسومة كخط: عرضها = طول الخط
            if width <= 0:
                continue
            et = op["element"].get("element_type")
            height = _num(od.get("height", 0))
            if height <= 0:
                from app.services.quantity_engine import _extract_dim_from_text
                height = _extract_dim_from_text(od, "height") or 0
            if height <= 0:
                et_val = et.value if hasattr(et, "value") else str(et)
                height = _OPENING_DEFAULT_HEIGHTS.get(et_val, 2.0)
            op["used"] = True
            total += round(width * height, 4)
        if total > 0:
            dims["opening_deduction_m2"] = round(total, 4)
            dims["opening_deduction_source"] = "OVERLAP"


def _insert_bbox(entity) -> Optional[Dict]:
    """ج7: أبعاد bbox لكتلة INSERT بعد تطبيق التحويل (موقع/مقياس/دوران)."""
    try:
        from ezdxf import bbox as ez_bbox
        ext = ez_bbox.extents([entity])
        if not ext.has_data:
            return None
        return _bbox_dims([(ext.extmin[0], ext.extmin[1]), (ext.extmax[0], ext.extmax[1])])
    except Exception:
        return None


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

    # ج7: كتل الأبواب/النوافذ/الفتحات = وحدة واحدة (باب واحد = كتلة واحدة)
    # بأبعاد bbox من الكتلة المحوّلة — ليست خطوطًا داخلية متعددة.
    element_type, _ = classify_layer_name(layer)
    if element_type in (ElementType.DOOR, ElementType.WINDOW, ElementType.OPENING):
        dims = {"block": block_name}
        bbox = _insert_bbox(entity)
        if bbox:
            dims.update(bbox)
        elements_by_layer[layer].append({
            "type": "INSERT",
            "quantity": 1.0,
            "unit": "قطة",
            "dimensions": dims,
        })
        return

    # ج7: بقية الكتل (جدران/كمرات...) — فك بالتحويل الكامل (موقع/مقياس/دوران)
    # عبر virtual_entities() حتى تظهر الكيانات الداخلية في مواضعها الصحيحة.
    try:
        virtual = list(entity.virtual_entities())
    except Exception:
        virtual = []
    for inner in virtual:
        inner_layer = inner.dxf.layer if hasattr(inner.dxf, 'layer') else layer
        if inner_layer in ("0", "DEFPOINTS", ""):
            inner_layer = layer

        if inner_layer not in elements_by_layer:
            elements_by_layer[inner_layer] = []

        try:
            _process_entity(inner, inner_layer, elements_by_layer, block_defs)
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
