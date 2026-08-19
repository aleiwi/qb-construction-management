from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from app.models.stage import Stage
from app.models.building import Building
from app.models.project import Project
from app.models.user import User
from app.models.quality_check import QualityCheck, QCStatus
from app.schemas.quality_check import QualityCheckCreate, QualityCheckUpdate


class QualityCheckService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, qc_id: int) -> Optional[QualityCheck]:
        result = await self.db.execute(select(QualityCheck).filter(QualityCheck.id == qc_id))
        return result.scalars().first()

    async def get_by_stage(self, stage_id: int) -> Optional[QualityCheck]:
        result = await self.db.execute(
            select(QualityCheck).filter(QualityCheck.stage_id == stage_id).order_by(QualityCheck.created_at.desc())
        )
        return result.scalars().first()

    async def get_all_with_names(self, skip: int = 0, limit: int = 50, project_ids: Optional[List[int]] = None) -> List:
        query = (
            select(QualityCheck, Stage.name.label("stage_name"), Building.name.label("building_name"), Project.name.label("project_name"))
            .join(Stage, QualityCheck.stage_id == Stage.id)
            .join(Building, Stage.building_id == Building.id)
            .join(Project, Building.project_id == Project.id)
        )
        if project_ids:
            query = query.filter(Project.id.in_(project_ids))
        query = query.offset(skip).limit(limit).order_by(QualityCheck.created_at.desc())
        result = await self.db.execute(query)
        return result.all()

    async def create(self, data: QualityCheckCreate, user_id: int) -> QualityCheck:
        qc = QualityCheck(
            stage_id=data.stage_id,
            inspected_by=user_id,
            status=QCStatus.PENDING,
            notes=data.notes,
        )
        self.db.add(qc)
        await self.db.commit()
        await self.db.refresh(qc)
        return qc

    async def update_status(self, qc: QualityCheck, status: str, notes: Optional[str], user_id: int) -> QualityCheck:
        qc.status = QCStatus(status)
        qc.inspected_by = user_id
        qc.checked_at = datetime.utcnow()
        if notes is not None:
            qc.notes = notes
        self.db.add(qc)
        await self.db.commit()
        await self.db.refresh(qc)
        return qc

    async def delete(self, qc_id: int) -> bool:
        qc = await self.get_by_id(qc_id)
        if not qc:
            return False
        await self.db.delete(qc)
        await self.db.commit()
        return True

    async def stage_has_passed_qc(self, stage_id: int) -> bool:
        qc = await self.get_by_stage(stage_id)
        return qc is not None and qc.status == QCStatus.PASSED