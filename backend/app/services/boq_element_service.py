import json
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_, update
from app.models.boq_element import BOQElement, ClassificationStatus, ElementType
from app.models.drawing import Drawing
from app.schemas.boq_element import BOQElementClassify
from app.services.auto_learner import record_classification
from app.services.audit_log_service import AuditLogService

# ج9: أسماء الأنواع بالعربية (وبعض المرادفات الشائعة) للبحث من الواجهة العربية
# Keys MUST be canonical ElementType values (foundation/stairs — NOT the
# legacy footing/staircase aliases, which match nothing in the DB).
_ARABIC_TYPE_ALIASES = {
    "جدار": "wall", "حائط": "wall", "جدران": "wall",
    "عمود": "column", "أعمدة": "column", "اعمدة": "column",
    "بلاطة": "slab", "بلاطات": "slab", "سقف": "slab", "أسقف": "slab", "اسقف": "slab",
    "جسر": "beam", "كمرة": "beam", "كمرات": "beam",
    "قاعدة": "foundation", "قواعد": "foundation", "أساس": "foundation", "اساس": "foundation",
    "باب": "door", "أبواب": "door", "ابواب": "door",
    "نافذة": "window", "نوافذ": "window", "شباك": "window", "شبابيك": "window",
    "درج": "stairs", "سلم": "stairs", "سلالم": "stairs",
    "أثاث": "furniture", "اثاث": "furniture", "تجهيز": "furniture", "تجهيزات": "furniture",
    "مغسلة": "furniture", "مغاسل": "furniture",
    "أخرى": "other", "اخرى": "other",
}


def _is_unclassified(status) -> bool:
    return status == ClassificationStatus.UNCLASSIFIED or status == "unclassified"


class BOQElementService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, element_id: int) -> Optional[BOQElement]:
        result = await self.db.execute(select(BOQElement).filter(BOQElement.id == element_id))
        return result.scalars().first()

    def _apply_filters(self, stmt, search=None, element_type=None, classification_status=None):
        if search:
            s = search.strip()
            layer_like = BOQElement.source_layer_name.ilike(f"%{s}%")
            # البحث يطابق اسم الطبقة أيضًا، أو نوع العنصر (بالإنجليزية أو العربية)
            matching_types = set()
            lower = s.lower()
            if lower in {et.value for et in ElementType}:
                matching_types.add(lower)
            for alias, et in _ARABIC_TYPE_ALIASES.items():
                if alias in s or s in alias:
                    matching_types.add(et)
            if matching_types:
                stmt = stmt.filter(or_(layer_like, BOQElement.element_type.in_(list(matching_types))))
            else:
                stmt = stmt.filter(layer_like)
        if element_type:
            stmt = stmt.filter(BOQElement.element_type == element_type)
        if classification_status:
            stmt = stmt.filter(BOQElement.classification_status == classification_status)
        return stmt

    async def get_by_drawing(
        self,
        drawing_id: int,
        skip: int = 0,
        limit: int = 500,
        search: Optional[str] = None,
        element_type: Optional[str] = None,
        classification_status: Optional[str] = None,
    ) -> List[BOQElement]:
        stmt = self._apply_filters(
            select(BOQElement).filter(BOQElement.drawing_id == drawing_id),
            search, element_type, classification_status,
        )
        result = await self.db.execute(
            stmt.order_by(BOQElement.created_at.asc()).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def count_by_drawing(
        self,
        drawing_id: int,
        search: Optional[str] = None,
        element_type: Optional[str] = None,
        classification_status: Optional[str] = None,
    ) -> int:
        stmt = self._apply_filters(
            select(func.count(BOQElement.id)).filter(BOQElement.drawing_id == drawing_id),
            search, element_type, classification_status,
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def get_drawing_summary(self, drawing_id: int) -> dict:
        rows = await self.db.execute(
            select(
                BOQElement.element_type,
                BOQElement.classification_status,
                func.count(BOQElement.id).label("cnt"),
            )
            .filter(BOQElement.drawing_id == drawing_id)
            .group_by(BOQElement.element_type, BOQElement.classification_status)
        )
        by_type = {}
        classified = 0
        unclassified = 0
        for row in rows.all():
            etype = row[0] if isinstance(row[0], str) else (row[0].value if row[0] else "other")
            status = row[1] if isinstance(row[1], str) else (row[1].value if row[1] else "unclassified")
            by_type.setdefault(etype, 0)
            by_type[etype] += row[2]
            if status == ClassificationStatus.UNCLASSIFIED:
                unclassified += row[2]
            else:
                classified += row[2]
        return {"by_type": by_type, "classified": classified, "unclassified": unclassified, "total": classified + unclassified}

    async def get_unclassified(self, skip: int = 0, limit: int = 50) -> List[BOQElement]:
        result = await self.db.execute(
            select(BOQElement)
            .filter(BOQElement.classification_status == ClassificationStatus.UNCLASSIFIED)
            .offset(skip)
            .limit(limit)
            .order_by(BOQElement.created_at.asc())
        )
        return result.scalars().all()

    async def classify_element(
        self, element: BOQElement, classify_data: BOQElementClassify, user_id: int
    ) -> BOQElement:
        old_type = element.element_type.value if isinstance(element.element_type, ElementType) else element.element_type
        old_status = element.classification_status.value if isinstance(element.classification_status, ClassificationStatus) else element.classification_status

        element.element_type = classify_data.element_type
        element.classification_status = classify_data.classification_status
        element.classified_by = user_id
        self.db.add(element)
        # Keep the parent drawing's stored counters in sync (they were only set
        # at extraction time, so manual classification left them stale vs live
        # aggregation). Guarded decrement — never below zero.
        if _is_unclassified(old_status) and not _is_unclassified(classify_data.classification_status):
            await self.db.execute(
                update(Drawing)
                .where(Drawing.id == element.drawing_id, Drawing.unclassified_count > 0)
                .values(
                    classified_count=Drawing.classified_count + 1,
                    unclassified_count=Drawing.unclassified_count - 1,
                )
            )
        await self.db.commit()
        await self.db.refresh(element)

        audit = AuditLogService(self.db)
        await audit.log(
            user_id=user_id,
            action="classify_element",
            entity_type="boq_element",
            entity_id=element.id,
            old_value={"element_type": old_type, "classification_status": old_status},
            new_value={"element_type": classify_data.element_type.value if isinstance(classify_data.element_type, ElementType) else classify_data.element_type, "classification_status": classify_data.classification_status.value if isinstance(classify_data.classification_status, ClassificationStatus) else classify_data.classification_status},
        )

        await record_classification(self.db, element)
        return element

    async def bulk_classify(
        self, element_ids: List[int], element_type: ElementType, user_id: int
    ) -> int:
        result = await self.db.execute(
            select(BOQElement).filter(BOQElement.id.in_(element_ids))
        )
        elements = result.scalars().all()
        count = 0
        per_drawing: dict = {}
        audit = AuditLogService(self.db)
        for el in elements:
            old_type = el.element_type.value if isinstance(el.element_type, ElementType) else el.element_type
            old_status = el.classification_status.value if isinstance(el.classification_status, ClassificationStatus) else el.classification_status

            el.element_type = element_type
            el.classification_status = ClassificationStatus.MANUALLY_CLASSIFIED
            el.classified_by = user_id
            self.db.add(el)
            count += 1
            if _is_unclassified(old_status):
                per_drawing[el.drawing_id] = per_drawing.get(el.drawing_id, 0) + 1

            await audit.log(
                user_id=user_id,
                action="bulk_classify_element",
                entity_type="boq_element",
                entity_id=el.id,
                old_value={"element_type": old_type, "classification_status": old_status},
                new_value={"element_type": element_type.value if isinstance(element_type, ElementType) else element_type, "classification_status": "manually_classified"},
            )

            await record_classification(self.db, el)
        # Sync parent drawing counters for newly-classified elements (see above).
        # Read-then-write per drawing so a stale counter can never go negative.
        for drawing_id, n in per_drawing.items():
            cur = (
                await self.db.execute(
                    select(Drawing.unclassified_count, Drawing.classified_count).filter(
                        Drawing.id == drawing_id
                    )
                )
            ).one_or_none()
            if cur:
                new_un = max(cur[0] - n, 0)
                moved = cur[0] - new_un
                await self.db.execute(
                    update(Drawing)
                    .where(Drawing.id == drawing_id)
                    .values(
                        classified_count=cur[1] + moved,
                        unclassified_count=new_un,
                    )
                )
        await self.db.commit()
        return count

    async def get_unclassified_count(self) -> int:
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count(BOQElement.id)).filter(
                BOQElement.classification_status == ClassificationStatus.UNCLASSIFIED
            )
        )
        return result.scalar() or 0

    async def get_by_drawing_with_text(self, drawing_id: int) -> List[dict]:
        """Get elements with nearby text labels for context analysis."""
        result = await self.db.execute(
            select(BOQElement)
            .filter(BOQElement.drawing_id == drawing_id)
        )
        elements = result.scalars().all()
        return [
            {
                "id": e.id,
                "element_type": e.element_type,
                "classification_status": e.classification_status,
                "source_layer_name": e.source_layer_name,
                "quantity": e.quantity,
                "unit": e.unit,
                "dimensions_json": e.dimensions_json,
            }
            for e in elements
        ]
