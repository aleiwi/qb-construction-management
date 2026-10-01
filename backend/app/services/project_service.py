from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_
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

    def _filters(self, search: Optional[str] = None,
                 status: Optional[ProjectStatus] = None,
                 project_ids: Optional[List[int]] = None):
        conds = []
        if project_ids:
            conds.append(Project.id.in_(project_ids))
        if status is not None:
            conds.append(Project.status == status)
        if search:
            like = f"%{search}%"
            conds.append(or_(
                Project.name.ilike(like),
                Project.location.ilike(like),
                Project.description.ilike(like),
            ))
        return conds

    async def get_all_with_counts(self, skip: int = 0, limit: int = 20,
                                  project_ids: Optional[List[int]] = None,
                                  search: Optional[str] = None,
                                  status: Optional[ProjectStatus] = None,
                                  sort: str = "newest"):
        """صفحة مشاريع + (مبانٍ، مراحل، تقدم مرجح) — تجميعات دفعية واحدة لكل صفحة."""
        from app.models.building import Building
        from app.models.stage import Stage
        order = {
            "newest": Project.created_at.desc(),
            "oldest": Project.created_at.asc(),
            "name": Project.name.asc(),
        }.get(sort, Project.created_at.desc())
        page_q = select(Project).offset(skip).limit(limit).order_by(order)
        for cond in self._filters(search=search, status=status, project_ids=project_ids):
            page_q = page_q.where(cond)
        projects = (await self.db.execute(page_q)).scalars().all()
        ids = [p.id for p in projects]
        if not ids:
            return []
        b_rows = await self.db.execute(
            select(Building.project_id, func.count(Building.id))
            .where(Building.project_id.in_(ids)).group_by(Building.project_id)
        )
        b_map = {pid: n for pid, n in b_rows.all()}
        s_rows = await self.db.execute(
            select(Building.project_id, func.count(Stage.id))
            .join(Stage, Stage.building_id == Building.id)
            .where(Building.project_id.in_(ids)).group_by(Building.project_id)
        )
        s_map = {pid: n for pid, n in s_rows.all()}
        p_rows = await self.db.execute(
            select(Building.project_id,
                   func.coalesce(func.sum(Stage.weight_percent * Stage.progress_percent) / 100, 0))
            .join(Stage, Stage.building_id == Building.id)
            .where(Building.project_id.in_(ids)).group_by(Building.project_id)
        )
        p_map = {pid: float(v or 0) for pid, v in p_rows.all()}
        out = []
        for p in projects:
            progress = round(min(100.0, max(0.0, p_map.get(p.id, 0.0))), 1)
            out.append((p, b_map.get(p.id, 0), s_map.get(p.id, 0), progress))
        return out

    async def create(self, project_in: ProjectCreate) -> Project:
        project = Project(
            name=project_in.name,
            description=project_in.description,
            location=project_in.location,
            status=project_in.status,
            overhead_percent=project_in.overhead_percent,
            profit_percent=project_in.profit_percent,
            contingency_percent=project_in.contingency_percent,
            vat_rate=project_in.vat_rate,
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

    async def count_total(self, search: Optional[str] = None,
                        status: Optional[ProjectStatus] = None,
                        project_ids: Optional[List[int]] = None) -> int:
        query = select(func.count(Project.id))
        for cond in self._filters(search=search, status=status, project_ids=project_ids):
            query = query.where(cond)
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def status_counts(self, project_ids: Optional[List[int]] = None) -> dict:
        query = select(Project.status, func.count(Project.id).label("n")).group_by(Project.status)
        if project_ids:
            query = query.where(Project.id.in_(project_ids))
        result = await self.db.execute(query)
        return {str(status): n for status, n in result.all()}