import json
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.boq_element import BOQElement, ClassificationStatus, ElementType
from app.schemas.boq_element import BOQElementClassify
from app.services.auto_learner import record_classification
from app.services.audit_log_service import AuditLogService


class BOQElementService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, element_id: int) -> Optional[BOQElement]:
        result = await self.db.execute(select(BOQElement).filter(BOQElement.id == element_id))
        return result.scalars().first()

    def _apply_filters(self, stmt, search=None, element_type=None, classification_status=None):
        if search:
            stmt = stmt.filter(BOQElement.source_layer_name.ilike(f"%{search}%"))
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
        audit = AuditLogService(self.db)
        for el in elements:
            old_type = el.element_type.value if isinstance(el.element_type, ElementType) else el.element_type
            old_status = el.classification_status.value if isinstance(el.classification_status, ClassificationStatus) else el.classification_status

            el.element_type = element_type
            el.classification_status = ClassificationStatus.MANUALLY_CLASSIFIED
            el.classified_by = user_id
            self.db.add(el)
            count += 1

            await audit.log(
                user_id=user_id,
                action="bulk_classify_element",
                entity_type="boq_element",
                entity_id=el.id,
                old_value={"element_type": old_type, "classification_status": old_status},
                new_value={"element_type": element_type.value if isinstance(element_type, ElementType) else element_type, "classification_status": "manually_classified"},
            )

            await record_classification(self.db, el)
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
