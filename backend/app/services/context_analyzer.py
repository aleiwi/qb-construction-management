from typing import Dict, List, Optional, Any


def build_context(
    layer_name: str,
    geometry_type: str,
    quantity: float,
    unit: str,
    dimensions_json: Optional[Dict[str, Any]] = None,
    text_labels: Optional[List[str]] = None,
    nearby_elements: Optional[List[Dict]] = None,
) -> Dict:
    dims = dimensions_json or {}

    context = {
        "layer_name": layer_name,
        "geometry_type": geometry_type,
        "quantity": quantity,
        "unit": unit,
        "dimensions": {
            "area": dims.get("area", 0),
            "length": dims.get("length", 0) or dims.get("perimeter", 0) or 0,
            "radius": dims.get("radius", 0),
            "width": dims.get("major_axis", 0),
            "height": dims.get("minor_axis", 0),
            "points": dims.get("points", 0),
            "closed": dims.get("closed", False),
        },
        "text_labels": text_labels or [],
        "nearby_types": [n.get("type", "") for n in (nearby_elements or [])],
    }

    # Normalize geometry type
    geo = geometry_type.upper()
    if geo in ("LWPOLYLINE",):
        is_closed = dims.get("closed", False)
        area = dims.get("area", 0)
        if is_closed and area > 0:
            context["geometry_type"] = "POLYGON"
        else:
            context["geometry_type"] = "LINE"
    elif geo == "CIRCLE":
        context["geometry_type"] = "CIRCLE"
    elif geo == "ELLIPSE":
        context["geometry_type"] = "ELLIPSE"
    elif geo == "SPLINE":
        context["geometry_type"] = "SPLINE"
    elif geo == "ARC":
        context["geometry_type"] = "ARC"
    elif geo == "LINE":
        context["geometry_type"] = "LINE"
    elif geo in ("DIMLINEAR", "DIMALIGNED", "DIMRADIUS", "DIMDIAMETER", "DIMANGULAR"):
        context["geometry_type"] = "DIMENSION"
    elif geo == "INSERT":
        context["geometry_type"] = "BLOCK"
        context["block_name"] = dims.get("block", "")
    elif geo == "HATCH":
        context["geometry_type"] = "HATCH"

    return context


def get_classification_features(context: Dict) -> Dict:
    features = {}

    layer = context.get("layer_name", "")
    dims = context.get("dimensions", {})
    geo = context.get("geometry_type", "")

    # Layer characteristics
    features["layer_has_number"] = bool(layer and any(c.isdigit() for c in layer))
    features["layer_has_prefix"] = bool(layer and any(layer.startswith(p) for p in ["a-", "a ", "s-", "s ", "e-", "e ", "m-", "p-"]))
    features["layer_length"] = len(layer) if layer else 0

    # Geometric features
    area = dims.get("area", 0)
    length = dims.get("length", 0)
    features["is_large_area"] = area > 10.0
    features["is_medium_area"] = 1.0 < area <= 10.0
    features["is_small_area"] = 0 < area <= 1.0
    features["is_long"] = length > 5.0
    features["is_medium_length"] = 1.0 < length <= 5.0
    features["is_short"] = 0 < length <= 1.0

    # Shape features
    features["is_rectangular"] = dims.get("points", 0) in (4, 5)  # quad with close
    features["is_circular"] = geo in ("CIRCLE", "ELLIPSE")
    features["is_linear"] = geo in ("LINE", "ARC")
    features["is_polygonal"] = geo in ("POLYGON", "SPLINE", "HATCH")
    features["is_count"] = geo == "BLOCK"

    # Text features
    texts = context.get("text_labels", [])
    features["has_text"] = len(texts) > 0
    features["has_dim_text"] = any(t for t in texts if any(kw in t.lower() for kw in ["mm", "cm", "m", "dim", "scale"]))

    return features
