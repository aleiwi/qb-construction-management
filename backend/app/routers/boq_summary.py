from typing import Optional
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.response import APIResponse
from app.services.boq_aggregator import aggregate_project_boq
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole
import json

router = APIRouter(prefix="/boq-summary", tags=["BOQ Summary"])


@router.get("/project/{project_id}")
async def get_project_boq(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    result = await aggregate_project_boq(db, project_id)
    if not result or result["elements_count"] == 0:
        return APIResponse.ok(data=result, message="لا توجد عناصر BOQ للمشروع")
    return APIResponse.ok(data=result, message="تم تجميع BOQ المشروع بنجاح")


@router.get("/project/{project_id}/export/excel")
async def export_boq_excel(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.ACCOUNTANT])),
):
    from app.services.excel_exporter import export_boq_to_excel
    from app.services.project_service import ProjectService

    result = await aggregate_project_boq(db, project_id)
    proj_service = ProjectService(db)
    project = await proj_service.get_by_id(project_id)
    project_name = project.name if project else f"Project #{project_id}"

    excel_bytes = export_boq_to_excel(result, project_name)
    filename = f"BOQ_{project_name.replace(' ', '_')}.xlsx"

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=\"BOQ.xlsx\"; filename*=UTF-8''{quote(filename)}"},
    )


@router.get("/project/{project_id}/export/pdf")
async def export_boq_pdf(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.ACCOUNTANT])),
):
    from app.services.pdf_exporter import export_boq_to_pdf
    from app.services.project_service import ProjectService

    result = await aggregate_project_boq(db, project_id)
    proj_service = ProjectService(db)
    project = await proj_service.get_by_id(project_id)
    project_name = project.name if project else f"Project #{project_id}"

    pdf_bytes = export_boq_to_pdf(result, project_name)
    filename = f"BOQ_{project_name.replace(' ', '_')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"BOQ.pdf\"; filename*=UTF-8''{quote(filename)}"},
    )


@router.get("/project/{project_id}/comparison")
async def get_boq_comparison(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.ACCOUNTANT])),
):
    from app.services.comparison_report import generate_comparison_report

    result = await generate_comparison_report(db, project_id)
    return APIResponse.ok(data=result, message="تم إنشاء تقرير المقارنة بنجاح")
