from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.stage import Stage
from app.schemas.stage import StageCreate, StageUpdate


class StageNotFoundException(Exception):
    pass


class StageService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, stage_id: int) -> Optional[Stage]:
        result = await self.db.execute(select(Stage).filter(Stage.id == stage_id))
        return result.scalars().first()

    async def get_by_building(self, building_id: int) -> List[Stage]:
        result = await self.db.execute(
            select(Stage)
            .filter(Stage.building_id == building_id)
            .order_by(Stage.created_at.asc())
        )
        return result.scalars().all()

    async def create(self, stage_in: StageCreate) -> Stage:
        stage = Stage(
            building_id=stage_in.building_id,
            name=stage_in.name,
            description=stage_in.description,
            weight_percent=stage_in.weight_percent,
            progress_percent=stage_in.progress_percent,
        )
        self.db.add(stage)
        await self.db.commit()
        await self.db.refresh(stage)
        return stage

    async def update(self, stage: Stage, stage_in: StageUpdate) -> Stage:
        update_data = stage_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(stage, field, value)
        self.db.add(stage)
        await self.db.commit()
        await self.db.refresh(stage)
        return stage

    async def update_progress(self, stage: Stage, progress_percent: float) -> Stage:
        stage.progress_percent = progress_percent
        self.db.add(stage)
        await self.db.commit()
        await self.db.refresh(stage)
        return stage

    async def delete(self, stage_id: int) -> bool:
        stage = await self.get_by_id(stage_id)
        if not stage:
            raise StageNotFoundException(f"المرحلة رقم {stage_id} غير موجودة")
        await self.db.delete(stage)
        await self.db.commit()
        return True

    async def get_building_overall_progress(self, building_id: int) -> float:
        result = await self.db.execute(
            select(Stage)
            .filter(Stage.building_id == building_id)
        )
        stages = result.scalars().all()
        if not stages:
            return 0.0
        total_weight = sum(float(s.weight_percent) for s in stages)
        if total_weight == 0:
            return 0.0
        weighted_progress = sum(float(s.weight_percent) * float(s.progress_percent) / 100 for s in stages)
        return round(weighted_progress / total_weight * 100, 2)