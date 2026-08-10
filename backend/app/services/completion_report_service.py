from typing import Optional, List
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.completion_report import CompletionReport
from app.models.project import Project
from app.schemas.completion_reports import CompletionReportCreate, CompletionReportUpdate, CloneRequest


class CompletionReportNotFoundException(Exception):
    pass


class CompletionReportProjectNotFoundException(Exception):
    pass


class CompletionReportNoPreviousException(Exception):
    pass


class CompletionReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _project_exists(self, project_id: int) -> bool:
        result = await self.db.execute(select(Project).filter(Project.id == project_id))
        return result.scalars().first() is not None

    async def get_by_id(self, report_id: int) -> Optional[CompletionReport]:
        result = await self.db.execute(select(CompletionReport).filter(CompletionReport.id == report_id))
        return result.scalars().first()

    async def get_latest_for_project(self, project_id: int) -> Optional[CompletionReport]:
        result = await self.db.execute(
            select(CompletionReport)
            .filter(CompletionReport.project_id == project_id)
            .order_by(CompletionReport.created_at.desc())
        )
        return result.scalars().first()

    async def list_by_project(self, project_id: int) -> List[CompletionReport]:
        result = await self.db.execute(
            select(CompletionReport)
            .filter(CompletionReport.project_id == project_id)
            .order_by(CompletionReport.created_at.desc())
        )
        return result.scalars().all()

    async def create(self, data: CompletionReportCreate, created_by: int) -> CompletionReport:
        if not await self._project_exists(data.project_id):
            raise CompletionReportProjectNotFoundException(f"المشروع {data.project_id} غير موجود")
        report = CompletionReport(
            project_id=data.project_id,
            report_data=data.report_data,
            report_period=data.report_period,
            period_type=data.period_type,
            period_start=data.period_start,
            period_end=data.period_end,
            status=data.status,
            parent_report_id=data.parent_report_id,
            created_by=created_by,
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return report

    async def update(self, report_id: int, data: CompletionReportUpdate) -> CompletionReport:
        report = await self.get_by_id(report_id)
        if not report:
            raise CompletionReportNotFoundException(f"التقرير {report_id} غير موجود")
        for field in ["report_data", "report_period", "period_type", "period_start", "period_end", "status", "is_archived"]:
            value = getattr(data, field, None)
            if value is not None:
                setattr(report, field, value)
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return report

    async def delete(self, report_id: int) -> None:
        report = await self.get_by_id(report_id)
        if not report:
            raise CompletionReportNotFoundException(f"التقرير {report_id} غير موجود")
        await self.db.delete(report)
        await self.db.commit()

    async def clone_previous(self, project_id: int, payload: CloneRequest, created_by: int) -> CompletionReport:
        if not await self._project_exists(project_id):
            raise CompletionReportProjectNotFoundException(f"المشروع {project_id} غير موجود")
        latest = await self.get_latest_for_project(project_id)
        if not latest:
            raise CompletionReportNoPreviousException("لا يوجد تقرير سابق للاستنساخ — أنشئ أول تقرير يدوياً")
        cloned = CompletionReport(
            project_id=project_id,
            report_data=dict(latest.report_data or {}),
            report_period=payload.report_period,
            period_type=payload.period_type,
            period_start=payload.period_start,
            period_end=payload.period_end,
            status="draft",
            parent_report_id=latest.id,
            created_by=created_by,
        )
        self.db.add(cloned)
        await self.db.commit()
        await self.db.refresh(cloned)
        return cloned
