from typing import List
import logging
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.completion_reports import (
    CompletionReportCreate, CompletionReportUpdate, CompletionReportOut,
    CompletionReportListItem, CloneRequest
)
from app.schemas.response import APIResponse
from app.services.completion_report_service import (
    CompletionReportService,
    CompletionReportNotFoundException,
    CompletionReportProjectNotFoundException,
    CompletionReportNoPreviousException,
)
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/completion-reports", tags=["Completion Reports"])

logger = logging.getLogger(__name__)


@router.get("", response_model=APIResponse[List[CompletionReportListItem]])
async def list_reports(
    project_id: int = Query(..., ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.ACCOUNTANT])),
):
    """جلب قائمة كافة تقارير المشروع المحفوظة عبر الفترات الزمنية."""
    service = CompletionReportService(db)
    reports = await service.list_by_project(project_id)
    items = [CompletionReportListItem.model_validate(r) for r in reports]
    return APIResponse.ok(data=items, message=f"تم جلب {len(items)} تقرير")


@router.get("/{report_id}", response_model=APIResponse[CompletionReportOut])
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.ACCOUNTANT])),
):
    service = CompletionReportService(db)
    report = await service.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="التقرير غير موجود")
    return APIResponse.ok(data=CompletionReportOut.model_validate(report), message="تم جلب التقرير بنجاح")


@router.post("", response_model=APIResponse[CompletionReportOut])
async def create_report(
    data: CompletionReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    service = CompletionReportService(db)
    try:
        report = await service.create(data, created_by=current_user.id)
    except CompletionReportProjectNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return APIResponse.ok(data=CompletionReportOut.model_validate(report), message="تم حفظ التقرير بنجاح")


@router.put("/{report_id}", response_model=APIResponse[CompletionReportOut])
async def update_report(
    report_id: int,
    data: CompletionReportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    service = CompletionReportService(db)
    try:
        report = await service.update(report_id, data)
    except CompletionReportNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return APIResponse.ok(data=CompletionReportOut.model_validate(report), message="تم تحديث التقرير بنجاح")


@router.delete("/{report_id}", response_model=APIResponse)
async def delete_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    service = CompletionReportService(db)
    try:
        await service.delete(report_id)
    except CompletionReportNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return APIResponse.ok(message="تم حذف التقرير بنجاح")


@router.post("/projects/{project_id}/clone-previous", response_model=APIResponse[CompletionReportOut])
async def clone_previous_report(
    project_id: int,
    payload: CloneRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    """
    نسخ آخر تقرير للمشروع كأساس لفترة جديدة:
      - يأخذ آخر تقرير محفوظ
      - يستنسخ كامل report_data كمسودة (Draft)
      - يربط التقرير الجديد بالأب عبر parent_report_id
      - لا يعدّل التقرير السابق (يظل أرشيفاً)
    """
    service = CompletionReportService(db)
    try:
        cloned = await service.clone_previous(project_id, payload, created_by=current_user.id)
    except CompletionReportProjectNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except CompletionReportNoPreviousException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return APIResponse.ok(
        data=CompletionReportOut.model_validate(cloned),
        message=f"تم استنساخ تقرير جديد للفترة ({payload.report_period}) من التقرير #{cloned.parent_report_id}"
    )


@router.post("/export-pdf")
async def export_completion_pdf(
    payload: dict,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.ACCOUNTANT])),
):
    """
    يستقبل report_data كـ JSON ويُعيد ملف PDF احترافي
    مُولَّد بواسطة Playwright (Chromium Headless).
    الملف يحتوي 6 صفحات A4 Landscape بجودة Vector مثالية.
    """
    from app.services.completion_pdf_service import generate_completion_pdf

    report_data = payload.get("report_data", payload)
    project_name = report_data.get("projectName", "تقرير")

    try:
        pdf_bytes = await generate_completion_pdf(report_data)
    except Exception as e:
        logger.exception("PDF export failed for project=%s report=%s", project_name, report_data.get("period") or report_data.get("reportPeriod"))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"فشل توليد PDF: {e}"
        )

    safe_name = project_name.replace(" ", "_")
    filename = f"تقرير_الإنجاز_{safe_name}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"report.pdf\"; filename*=UTF-8''{quote(filename)}",
            "Content-Length": str(len(pdf_bytes)),
        }
    )
