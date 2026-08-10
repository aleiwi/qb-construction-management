from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.retention_release import RetentionReleaseCreate, RetentionReleaseUpdate, RetentionReleaseOut
from app.schemas.response import APIResponse
from app.services.retention_service import RetentionReleaseService
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/retention-releases", tags=["Retention Releases"])


@router.get("", response_model=APIResponse[List[RetentionReleaseOut]])
async def list_retentions(
    contract_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT])),
):
    service = RetentionReleaseService(db)
    if contract_id:
        releases = await service.get_by_contract(contract_id)
    else:
        releases = await service.get_all(skip=(page - 1) * page_size, limit=page_size)
    items = [RetentionReleaseOut.model_validate(r) for r in releases]
    return APIResponse.ok(data=items, message="تم جلب الضمانات المحتجزة بنجاح")


@router.post("", response_model=APIResponse[RetentionReleaseOut])
async def create_retention(
    release_in: RetentionReleaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    service = RetentionReleaseService(db)
    release = await service.create(release_in)
    return APIResponse.ok(data=RetentionReleaseOut.model_validate(release), message="تم تسجيل الضمان المحتجز بنجاح")


@router.get("/{release_id}", response_model=APIResponse[RetentionReleaseOut])
async def get_retention(
    release_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT])),
):
    service = RetentionReleaseService(db)
    release = await service.get_by_id(release_id)
    if not release:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="غير موجود")
    return APIResponse.ok(data=RetentionReleaseOut.model_validate(release), message="تم جلب البيانات بنجاح")


@router.patch("/{release_id}/release", response_model=APIResponse[RetentionReleaseOut])
async def release_retention(
    release_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.ACCOUNTANT])),
):
    service = RetentionReleaseService(db)
    release = await service.get_by_id(release_id)
    if not release:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="غير موجود")
    release = await service.release_retention(release, current_user.id)
    return APIResponse.ok(data=RetentionReleaseOut.model_validate(release), message="تم تحرير الضمان بنجاح")


@router.delete("/{release_id}", response_model=APIResponse)
async def delete_retention(
    release_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    service = RetentionReleaseService(db)
    deleted = await service.delete(release_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="غير موجود")
    return APIResponse.ok(message="تم الحذف بنجاح")