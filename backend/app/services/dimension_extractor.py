import re
from typing import List, Optional, Dict, Tuple


def extract_dimensions_from_mtext(texts: List[str]) -> Dict[str, float]:
    """Parse MTEXT/TEXT content for dimension labels like 'W200x300' or '20x40cm'."""
    dims = {}
    combined = " ".join(texts) if texts else ""

    if not combined:
        return dims

    # Pattern 1: WxH or WxHxD like "200x300", "20x40cm", "W200x300mm"
    patterns = [
        r"(?:W|عرض)?\s*(\d+[.,]?\d*)\s*[xX×*]\s*(\d+[.,]?\d*)\s*(?:mm|cm|مم|سم)?\s*(?:xX×*\s*(\d+[.,]?\d*)\s*(?:mm|cm|مم|سم))?",
        r"(?:dim|أبعاد)\s*[:=]\s*(\d+[.,]?\d*)\s*[xX×]\s*(\d+[.,]?\d*)",
        r"(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*[xX×]\s*(\d{2,4})",
    ]

    for pat in patterns:
        m = re.search(pat, combined, re.IGNORECASE)
        if m:
            parts = [float(g.replace(",", ".")) for g in m.groups() if g]
            if len(parts) >= 2:
                # Assume values > 100 are in mm, < 100 in meters, < 10 likely meters
                dims["width"] = _to_meters(parts[0])
                dims["height"] = _to_meters(parts[1])
            if len(parts) >= 3:
                dims["depth"] = _to_meters(parts[2])
            return dims

    # Pattern 2: "THK 200" or "THICKNESS 0.20"
    thk = re.search(r"(?:THK|THICKNESS|سمك|سماكة)\s*(\d+[.,]?\d*)", combined, re.IGNORECASE)
    if thk:
        dims["thickness"] = _to_meters(float(thk.group(1).replace(",", ".")))

    # Pattern 3: "L=5.0" or "LENGTH 5000"
    length = re.search(r"(?:L|LENGTH|طول)\s*[=:]?\s*(\d+[.,]?\d*)", combined, re.IGNORECASE)
    if length:
        dims["length"] = _to_meters(float(length.group(1).replace(",", ".")))

    # Pattern 4: "H=3.0" or "HEIGHT 300"
    height = re.search(r"(?:H|HEIGHT|ارتفاع)\s*[=:]?\s*(\d+[.,]?\d*)", combined, re.IGNORECASE)
    if height:
        dims["height"] = _to_meters(float(height.group(1).replace(",", ".")))

    return dims


def _to_meters(value: float) -> float:
    """Convert a dimension value to meters. Heuristic based on magnitude."""
    if value > 100:
        return round(value / 1000, 3)  # mm → m
    elif value > 10:
        return round(value / 100, 3)  # cm → m
    else:
        return round(value, 3)  # Already in meters


def estimate_element_dimensions(
    element_type: str,
    geometry_type: str,
    dims: Dict,
    text_labels: List[str],
) -> Dict[str, float]:
    """Estimate missing dimensions from geometry and text."""
    result = {}

    area = dims.get("area", 0) or dims.get("quantity", 0) or 0
    length = dims.get("length", 0) or 0
    radius = dims.get("radius", 0) or 0

    # Extract from text first
    text_dims = extract_dimensions_from_mtext(text_labels)
    result.update(text_dims)

    # Fill from geometry if text didn't provide
    if "height" not in result:
        if radius > 0:
            result["height"] = radius * 2
        elif area > 0 and length > 0:
            result["height"] = round(area / length, 2)

    if "width" not in result and "height" in result:
        result["width"] = result["height"]

    if "thickness" not in result:
        if element_type in ("slab", "roof"):
            result["thickness"] = 0.20
        elif element_type == "wall":
            result["thickness"] = 0.20

    return result
