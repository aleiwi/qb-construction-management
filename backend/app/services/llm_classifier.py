import os
import json
from typing import Optional, Tuple
from app.models.boq_element import ElementType


OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_BOQ_MODEL", "deepseek-coder:6.7b")
OLLAMA_TIMEOUT = int(os.environ.get("OLLAMA_TIMEOUT", "30"))

CLASSIFICATION_PROMPT = """You are a construction engineering expert. Classify the following CAD element into a standard construction element type.

## Element Context:
- Layer name: {layer_name}
- Geometry type: {geometry_type}
- Quantity: {quantity} {unit}
- Dimensions: {dimensions_json}
- Nearby text labels: {text_labels}

## Rules:
- WALL: vertical structural/partition element (long, thin polygons or lines)
- COLUMN: vertical support (small circular/square polygons, isolated)
- SLAB: horizontal floor/roof (large area polygons)
- BEAM: horizontal structural support (long rectangular polygons)
- FOUNDATION: base support (large circular/rectangular, footings)
- DOOR: opening for passage (rectangular, often in wall layers)
- WINDOW: opening for light (rectangular, often in wall layers)
- STAIRS: stepped circulation (angled/stepped geometry)
- ROOF: top covering (large area polygons on roof layers)
- PARTITION: non-structural divider (thin walls)
- OPENING: hole/void in structure (rectangular/circular in slabs/walls)

## Response:
Return ONLY a JSON object with two fields:
{{"element_type": "WALL|COLUMN|SLAB|BEAM|FOUNDATION|DOOR|WINDOW|STAIRS|ROOF|PARTITION|OPENING|OTHER", "confidence": 0.0-1.0}}
"""


async def classify(context: dict) -> Optional[Tuple[ElementType, float]]:
    """Send classification request to local Ollama instance."""
    try:
        import httpx

        prompt = CLASSIFICATION_PROMPT.format(
            layer_name=context.get("layer_name", "unknown"),
            geometry_type=context.get("geometry_type", "UNKNOWN"),
            quantity=context.get("quantity", 0),
            unit=context.get("unit", "م2"),
            dimensions_json=json.dumps(context.get("dimensions", {}), ensure_ascii=False),
            text_labels=", ".join(context.get("text_labels", [])),
        )

        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.1, "num_predict": 256},
                },
            )

            if response.status_code != 200:
                return None

            result = response.json()
            raw_text = result.get("response", "").strip()

            # Extract JSON from response
            parsed = _extract_json(raw_text)
            if parsed and "element_type" in parsed:
                et_str = parsed["element_type"].strip().upper()
                confidence = float(parsed.get("confidence", 0.5))
                try:
                    element_type = ElementType(et_str.lower())
                    return (element_type, min(confidence, 0.95))
                except ValueError:
                    return None

            return None

    except ImportError:
        return None
    except Exception:
        return None


async def is_available() -> bool:
    """Check if Ollama server is reachable."""
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return response.status_code == 200
    except Exception:
        return False


def _extract_json(text: str) -> Optional[dict]:
    """Extract JSON object from LLM response text."""
    # Try direct JSON parse
    text = text.strip()
    if text.startswith("{") and text.endswith("}"):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

    # Try to find JSON between braces
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    return None
