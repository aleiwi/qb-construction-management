from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.quality_check import QualityCheckCreate, QualityCheckUpdate, QualityCheckOut, QualityCheckListOut
from app.schemas.response import APIResponse
from app.services.quality_check_service import QualityCheckService
from app.dependencies.auth import require_roles, check_entity_access, allowed_project_ids
from app.models.user import User, UserRole

router = APIRouter(prefix="/quality-checks", tags=["Quality Checks"])


@router.get("", response_model=APIResponse[List[QualityCheckListOut]])
async def list_quality_checks(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    service = QualityCheckService(db)
    results = await service.get_all_with_names(
        skip=(page - 1) * page_size, limit=page_size,
        project_ids=await allowed_project_ids(current_user, db),
    )
    items = []
    for row in results:
        qc = row[0]
        items.append(QualityCheckListOut(
            id=qc.id, stage_id=qc.stage_id, inspected_by=qc.inspected_by,
            status=qc.status.value if qc.status else None,
            notes=qc.notes, checked_at=qc.checked_at,
            created_at=qc.created_at,
            stage_name=row[1], building_name=row[2], project_name=row[3],
        ))
    return APIResponse.ok(data=items, message="تم جلب فحوصات الجودة بنجاح")


@router.post("", response_model=APIResponse[QualityCheckOut])
async def create_quality_check(
    data: QualityCheckCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    await check_entity_access(db, current_user, "stage", data.stage_id)
    service = QualityCheckService(db)
    existing = await service.get_by_stage(data.stage_id)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="يوجد فحص جودة مسجل لهذه المرحلة مسبقاً")
    qc = await service.create(data, current_user.id)
    return APIResponse.ok(data=QualityCheckOut.model_validate(qc), message="تم إنشاء فحص الجودة بنجاح")


@router.get("/{qc_id}", response_model=APIResponse[QualityCheckOut])
async def get_quality_check(
    qc_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.CONTRACTOR])),
):
    await check_entity_access(db, current_user, "quality_check", qc_id)
    service = QualityCheckService(db)
    qc = await service.get_by_id(qc_id)
    if not qc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الفحص غير موجود")
    return APIResponse.ok(data=QualityCheckOut.model_validate(qc), message="تم جلب بيانات الفحص بنجاح")


@router.patch("/{qc_id}", response_model=APIResponse[QualityCheckOut])
async def update_quality_check(
    qc_id: int,
    data: QualityCheckUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    await check_entity_access(db, current_user, "quality_check", qc_id)
    service = QualityCheckService(db)
    qc = await service.get_by_id(qc_id)
    if not qc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الفحص غير موجود")
    qc = await service.update_status(qc, data.status, data.notes, current_user.id)
    return APIResponse.ok(data=QualityCheckOut.model_validate(qc), message="تم تحديث نتيجة الفحص بنجاح")


@router.delete("/{qc_id}", response_model=APIResponse)
async def delete_quality_check(
    qc_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    await check_entity_access(db, current_user, "quality_check", qc_id)
    service = QualityCheckService(db)
    deleted = await service.delete(qc_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الفحص غير موجود")
    return APIResponse.ok(message="تم حذف فحص الجودة بنجاح")