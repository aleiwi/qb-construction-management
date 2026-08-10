from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.building import Building
from app.models.stage import Stage
from app.schemas.building import BuildingCreate, BuildingUpdate


class BuildingNotFoundException(Exception):
    pass


class BuildingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, building_id: int) -> Optional[Building]:
        result = await self.db.execute(select(Building).filter(Building.id == building_id))
        return result.scalars().first()

    async def get_by_project(self, project_id: int) -> List[Building]:
        result = await self.db.execute(
            select(Building)
            .filter(Building.project_id == project_id)
            .order_by(Building.created_at.desc())
        )
        return result.scalars().all()

    async def get_all_with_counts(self, skip: int = 0, limit: int = 20):
        subquery = (
            select(
                Stage.building_id,
                func.count(Stage.id).label("stages_count"),
                func.coalesce(func.sum(Stage.weight_percent), 0).label("total_weight"),
            )
            .group_by(Stage.building_id)
            .subquery()
        )
        query = (
            select(
                Building,
                func.coalesce(subquery.c.stages_count, 0).label("stages_count"),
                func.coalesce(subquery.c.total_weight, 0).label("total_weight"),
            )
            .outerjoin(subquery, Building.id == subquery.c.building_id)
            .offset(skip)
            .limit(limit)
            .order_by(Building.created_at.desc())
        )
        result = await self.db.execute(query)
        return result.all()

    async def create(self, building_in: BuildingCreate) -> Building:
        building = Building(
            project_id=building_in.project_id,
            name=building_in.name,
            floors_count=building_in.floors_count,
        )
        self.db.add(building)
        await self.db.commit()
        await self.db.refresh(building)
        return building

    async def update(self, building: Building, building_in: BuildingUpdate) -> Building:
        update_data = building_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(building, field, value)
        self.db.add(building)
        await self.db.commit()
        await self.db.refresh(building)
        return building

    async def delete(self, building_id: int) -> bool:
        building = await self.get_by_id(building_id)
        if not building:
            raise BuildingNotFoundException(f"المبنى رقم {building_id} غير موجود")
        await self.db.delete(building)
        await self.db.commit()
        return True