from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.stage import StageCreate, StageUpdate, StageOut, StageProgressUpdate
from app.schemas.response import APIResponse
from app.services.stage_service import StageService, StageNotFoundException
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/stages", tags=["Stages"])


@router.get("", response_model=APIResponse[List[StageOut]])
async def list_stages(
    building_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    stage_service = StageService(db)
    if building_id:
        stages = await stage_service.get_by_building(building_id)
    else:
        stages = []
    items = [StageOut.model_validate(s) for s in stages]
    return APIResponse.ok(data=items, message="تم جلب قائمة المراحل بنجاح")


@router.post("", response_model=APIResponse[StageOut])
async def create_stage(
    stage_in: StageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    stage_service = StageService(db)
    stage = await stage_service.create(stage_in)
    return APIResponse.ok(data=StageOut.model_validate(stage), message="تم إضافة المرحلة بنجاح")


@router.get("/{stage_id}", response_model=APIResponse[StageOut])
async def get_stage(
    stage_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    stage_service = StageService(db)
    stage = await stage_service.get_by_id(stage_id)
    if not stage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المرحلة غير موجودة")
    return APIResponse.ok(data=StageOut.model_validate(stage), message="تم جلب بيانات المرحلة بنجاح")


@router.put("/{stage_id}", response_model=APIResponse[StageOut])
async def update_stage(
    stage_id: int,
    stage_in: StageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    stage_service = StageService(db)
    stage = await stage_service.get_by_id(stage_id)
    if not stage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المرحلة غير موجودة")
    updated = await stage_service.update(stage, stage_in)
    return APIResponse.ok(data=StageOut.model_validate(updated), message="تم تحديث المرحلة بنجاح")


@router.patch("/{stage_id}/progress", response_model=APIResponse[StageOut])
async def update_stage_progress(
    stage_id: int,
    progress_in: StageProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    stage_service = StageService(db)
    stage = await stage_service.get_by_id(stage_id)
    if not stage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المرحلة غير موجودة")
    updated = await stage_service.update_progress(stage, progress_in.progress_percent)
    return APIResponse.ok(data=StageOut.model_validate(updated), message="تم تحديث نسبة الإنجاز بنجاح")


@router.delete("/{stage_id}", response_model=APIResponse)
async def delete_stage(
    stage_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    stage_service = StageService(db)
    try:
        await stage_service.delete(stage_id)
    except StageNotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المرحلة غير موجودة")
    return APIResponse.ok(message="تم حذف المرحلة بنجاح")