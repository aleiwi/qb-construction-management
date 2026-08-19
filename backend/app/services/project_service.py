from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.project import Project, ProjectStatus
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectNotFoundException(Exception):
    pass


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, project_id: int) -> Optional[Project]:
        result = await self.db.execute(select(Project).filter(Project.id == project_id))
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 20) -> List[Project]:
        result = await self.db.execute(select(Project).offset(skip).limit(limit).order_by(Project.created_at.desc()))
        return result.scalars().all()

    async def get_all_with_counts(self, skip: int = 0, limit: int = 20, project_ids: Optional[List[int]] = None):
        from app.models.building import Building
        subquery = select(Building.project_id, func.count(Building.id).label("buildings_count")).group_by(Building.project_id).subquery()
        query = (
            select(Project, func.coalesce(subquery.c.buildings_count, 0).label("buildings_count"))
            .outerjoin(subquery, Project.id == subquery.c.project_id)
            .offset(skip)
            .limit(limit)
            .order_by(Project.created_at.desc())
        )
        if project_ids:
            query = query.where(Project.id.in_(project_ids))
        result = await self.db.execute(query)
        return result.all()

    async def create(self, project_in: ProjectCreate) -> Project:
        project = Project(
            name=project_in.name,
            description=project_in.description,
            location=project_in.location,
            status=project_in.status,
        )
        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def update(self, project: Project, project_in: ProjectUpdate) -> Project:
        update_data = project_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)
        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def delete(self, project_id: int) -> bool:
        project = await self.get_by_id(project_id)
        if not project:
            raise ProjectNotFoundException(f"المشروع رقم {project_id} غير موجود")
        await self.db.delete(project)
        await self.db.commit()
        return True

    async def count_total(self) -> int:
        result = await self.db.execute(select(func.count(Project.id)))
        return result.scalar() or 0