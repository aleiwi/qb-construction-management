from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.building import BuildingCreate, BuildingUpdate, BuildingOut, BuildingListOut
from app.schemas.response import APIResponse
from app.services.building_service import BuildingService, BuildingNotFoundException
from app.services.stage_service import StageService
from app.dependencies.auth import get_current_user, require_roles, check_entity_access
from app.models.user import User, UserRole

router = APIRouter(prefix="/buildings", tags=["Buildings"])


@router.get("", response_model=APIResponse[List[BuildingListOut]])
async def list_buildings(
    project_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    building_service = BuildingService(db)
    stage_service = StageService(db)

    if project_id:
        buildings = await building_service.get_by_project(project_id)
        items = []
        for b in buildings:
            progress = await stage_service.get_building_overall_progress(b.id)
            items.append(BuildingListOut(
                id=b.id,
                project_id=b.project_id,
                name=b.name,
                floors_count=b.floors_count,
                created_at=b.created_at,
                updated_at=b.updated_at,
                stages_count=len(b.stages) if b.stages else 0,
                total_weight=sum(float(s.weight_percent) for s in (b.stages or [])),
                overall_progress=progress,
            ))
    else:
        results = await building_service.get_all_with_counts(skip=(page - 1) * page_size, limit=page_size)
        items = []
        for row in results:
            b = row[0]
            stages_count = row[1]
            total_weight = row[2]
            progress = await stage_service.get_building_overall_progress(b.id)
            items.append(BuildingListOut(
                id=b.id,
                project_id=b.project_id,
                name=b.name,
                floors_count=b.floors_count,
                created_at=b.created_at,
                updated_at=b.updated_at,
                stages_count=stages_count,
                total_weight=float(total_weight),
                overall_progress=progress,
            ))

    return APIResponse.ok(data=items, message="تم جلب قائمة المباني بنجاح")


@router.post("", response_model=APIResponse[BuildingOut])
async def create_building(
    building_in: BuildingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    building_service = BuildingService(db)
    building = await building_service.create(building_in)
    return APIResponse.ok(data=BuildingOut.model_validate(building), message="تم إضافة المبنى بنجاح")


@router.get("/{building_id}", response_model=APIResponse[BuildingOut])
async def get_building(
    building_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    await check_entity_access(db, current_user, "building", building_id)
    building_service = BuildingService(db)
    building = await building_service.get_by_id(building_id)
    if not building:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المبنى غير موجود")
    return APIResponse.ok(data=BuildingOut.model_validate(building), message="تم جلب بيانات المبنى بنجاح")


@router.put("/{building_id}", response_model=APIResponse[BuildingOut])
async def update_building(
    building_id: int,
    building_in: BuildingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    await check_entity_access(db, current_user, "building", building_id)
    building_service = BuildingService(db)
    building = await building_service.get_by_id(building_id)
    if not building:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المبنى غير موجود")
    updated = await building_service.update(building, building_in)
    return APIResponse.ok(data=BuildingOut.model_validate(updated), message="تم تحديث المبنى بنجاح")


@router.delete("/{building_id}", response_model=APIResponse)
async def delete_building(
    building_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    await check_entity_access(db, current_user, "building", building_id)
    building_service = BuildingService(db)
    try:
        await building_service.delete(building_id)
    except BuildingNotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المبنى غير موجود")
    return APIResponse.ok(message="تم حذف المبنى بنجاح")