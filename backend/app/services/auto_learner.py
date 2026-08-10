import json
from typing import Optional, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.boq_element import BOQElement, ElementType, ClassificationStatus
from app.services.classifier_rules import RuleMatch


class ClassificationMemory:
    """In-memory cache of classification patterns for faster lookup."""

    def __init__(self):
        self.exact_layer: Dict[str, ElementType] = {}
        self.pattern_matches: List[tuple] = []

    def add_example(self, layer_name: str, element_type: ElementType):
        key = layer_name.lower().strip()
        if key not in self.exact_layer:
            self.exact_layer[key] = element_type

    def lookup(self, layer_name: str) -> Optional[ElementType]:
        return self.exact_layer.get(layer_name.lower().strip())

    def size(self) -> int:
        return len(self.exact_layer)


_memory = ClassificationMemory()


def get_memory() -> ClassificationMemory:
    return _memory


async def load_training_data(db: AsyncSession):
    """Load all manually classified elements into memory on startup."""
    result = await db.execute(
        select(BOQElement)
        .filter(BOQElement.classification_status == ClassificationStatus.MANUALLY_CLASSIFIED)
        .order_by(BOQElement.updated_at.desc())
    )
    elements = result.scalars().all()

    for el in elements:
        _memory.add_example(el.source_layer_name, el.element_type)


async def record_classification(db: AsyncSession, element: BOQElement):
    """After manual classification, update memory."""
    if element.classification_status == ClassificationStatus.MANUALLY_CLASSIFIED:
        _memory.add_example(element.source_layer_name, element.element_type)


def get_stats() -> dict:
    return {
        "patterns_learned": _memory.size(),
        "exact_layer_matches": list(_memory.exact_layer.items())[:50],
    }
