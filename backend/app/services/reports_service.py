from datetime import date, datetime
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from app.models.project import Project, ProjectStatus
from app.models.building import Building
from app.models.stage import Stage
from app.models.contractor import Contractor
from app.models.contract import Contract
from app.models.payment import Payment, PaymentStatus
from app.models.quality_check import QualityCheck, QCStatus
from app.models.employee import Employee, Attendance, AttendanceStatus
from app.models.drawing import Drawing
from app.models.boq_element import BOQElement, ClassificationStatus
from app.models.completion_report import CompletionReport
from app.models.project import Project


class ReportsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_kpis(self) -> Dict[str, Any]:
        projects_total = (await self.db.execute(select(func.count(Project.id)))).scalar() or 0
        projects_active = (await self.db.execute(
            select(func.count(Project.id)).filter(Project.status == ProjectStatus.IN_PROGRESS)
        )).scalar() or 0
        projects_completed = (await self.db.execute(
            select(func.count(Project.id)).filter(Project.status == ProjectStatus.COMPLETED)
        )).scalar() or 0

        buildings_total = (await self.db.execute(select(func.count(Building.id)))).scalar() or 0
        stages_total = (await self.db.execute(select(func.count(Stage.id)))).scalar() or 0
        avg_progress = (await self.db.execute(
            select(func.coalesce(func.avg(Stage.progress_percent), 0))
        )).scalar() or 0

        contractors_total = (await self.db.execute(select(func.count(Contractor.id)))).scalar() or 0
        contracts_total = (await self.db.execute(select(func.count(Contract.id)))).scalar() or 0
        contracts_active = (await self.db.execute(
            select(func.count(Contract.id)).filter(Contract.status == "active")
        )).scalar() or 0
        contracts_value = (await self.db.execute(
            select(func.coalesce(func.sum(Contract.total_value), 0))
        )).scalar() or 0

        payments_total = (await self.db.execute(select(func.count(Payment.id)))).scalar() or 0
        payments_pending = (await self.db.execute(
            select(func.count(Payment.id)).filter(Payment.status == PaymentStatus.PENDING)
        )).scalar() or 0
        payments_approved = (await self.db.execute(
            select(func.count(Payment.id)).filter(Payment.status == PaymentStatus.APPROVED)
        )).scalar() or 0
        payments_paid = (await self.db.execute(
            select(func.count(Payment.id)).filter(Payment.status == PaymentStatus.PAID)
        )).scalar() or 0
        payments_paid_value = (await self.db.execute(
            select(func.coalesce(func.sum(Payment.net_amount), 0)).filter(Payment.status == PaymentStatus.PAID)
        )).scalar() or 0
        payments_pending_value = (await self.db.execute(
            select(func.coalesce(func.sum(Payment.net_amount), 0)).filter(Payment.status.in_([PaymentStatus.PENDING, PaymentStatus.APPROVED]))
        )).scalar() or 0

        qc_total = (await self.db.execute(select(func.count(QualityCheck.id)))).scalar() or 0
        qc_passed = (await self.db.execute(
            select(func.count(QualityCheck.id)).filter(QualityCheck.status == QCStatus.PASSED)
        )).scalar() or 0
        qc_failed = (await self.db.execute(
            select(func.count(QualityCheck.id)).filter(QualityCheck.status == QCStatus.FAILED)
        )).scalar() or 0
        qc_pending = (await self.db.execute(
            select(func.count(QualityCheck.id)).filter(QualityCheck.status == QCStatus.PENDING)
        )).scalar() or 0

        employees_total = (await self.db.execute(select(func.count(Employee.id)))).scalar() or 0
        employees_active = (await self.db.execute(
            select(func.count(Employee.id)).filter(Employee.is_active == True)
        )).scalar() or 0
        monthly_payroll = (await self.db.execute(
            select(func.coalesce(func.sum(Employee.monthly_salary), 0)).filter(Employee.is_active == True)
        )).scalar() or 0

        from app.services.auto_learner import get_memory as memory_stats
        patterns_learned = memory_stats().size()
        drawings_total = (await self.db.execute(select(func.count(Drawing.id)))).scalar() or 0
        boq_elements_total = (await self.db.execute(select(func.count(BOQElement.id)))).scalar() or 0
        boq_auto = (await self.db.execute(
            select(func.count(BOQElement.id)).filter(BOQElement.classification_status == ClassificationStatus.AUTO_CLASSIFIED)
        )).scalar() or 0
        boq_manual = (await self.db.execute(
            select(func.count(BOQElement.id)).filter(BOQElement.classification_status == ClassificationStatus.MANUALLY_CLASSIFIED)
        )).scalar() or 0
        boq_unclassified = (await self.db.execute(
            select(func.count(BOQElement.id)).filter(BOQElement.classification_status == ClassificationStatus.UNCLASSIFIED)
        )).scalar() or 0
        boq_by_type = (await self.db.execute(
            select(BOQElement.element_type, func.count(BOQElement.id).label("cnt"))
            .group_by(BOQElement.element_type)
            .order_by(func.count(BOQElement.id).desc())
        )).all()

        # === تقارير نسب الإنجاز (Completion Reports) ===
        completion_reports_total = (await self.db.execute(
            select(func.count(CompletionReport.id))
        )).scalar() or 0
        latest_by_project = []
        seen_projects = set()
        reports_rows = (await self.db.execute(
            select(CompletionReport).order_by(CompletionReport.created_at.desc())
        )).scalars().all()
        for rep in reports_rows:
            if rep.project_id in seen_projects:
                continue
            seen_projects.add(rep.project_id)
            overall = None
            try:
                rd = rep.report_data or {}
                st = rd.get("structureItems") or []
                fn = rd.get("finishingItems") or []
                st_avg = sum(float(i.get("progress") or 0) for i in st) / len(st) if st else 0
                fn_avg = sum(float(i.get("progress") or 0) for i in fn) / len(fn) if fn else 0
                overall = round(st_avg * 0.5 + fn_avg * 0.5, 1)
            except Exception:
                overall = None
            proj = (await self.db.execute(
                select(Project).filter(Project.id == rep.project_id)
            )).scalar()
            latest_by_project.append({
                "project_id": rep.project_id,
                "project_name": proj.name if proj else f"مشروع #{rep.project_id}",
                "report_period": rep.report_period,
                "overall": overall,
            })
        projects_with_reports = len(latest_by_project)

        return {
            "projects": {
                "total": projects_total, "active": projects_active, "completed": projects_completed,
                "buildings": buildings_total, "stages": stages_total,
                "avg_progress": float(avg_progress),
            },
            "contracts": {
                "total": contracts_total, "active": contracts_active,
                "contractors": contractors_total, "total_value": float(contracts_value),
            },
            "payments": {
                "total": payments_total, "pending": payments_pending,
                "approved": payments_approved, "paid": payments_paid,
                "paid_value": float(payments_paid_value),
                "pending_value": float(payments_pending_value),
            },
            "quality_checks": {
                "total": qc_total, "passed": qc_passed, "failed": qc_failed, "pending": qc_pending,
            },
            "hr": {
                "total_employees": employees_total, "active_employees": employees_active,
                "monthly_payroll": float(monthly_payroll),
            },
            "boq": {
                "drawings": drawings_total, "elements_total": boq_elements_total,
                "classified": boq_auto + boq_manual, "unclassified": boq_unclassified,
                "auto_classified": boq_auto, "manually_classified": boq_manual,
                "by_type": {row[0]: row[1] for row in boq_by_type},
                "patterns_learned": patterns_learned,
            },
            "completion": {
                "reports_total": completion_reports_total,
                "projects_with_reports": projects_with_reports,
                "latest_by_project": latest_by_project,
            },
            "generated_at": datetime.utcnow().isoformat(),
        }