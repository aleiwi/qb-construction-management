from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.boq_item import BOQItemCreate, BOQItemOut
from app.schemas.response import APIResponse
from app.services.boq_item_service import BOQItemService
from app.services.boq_element_service import BOQElementService
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/boq-items", tags=["BOQ Items"])


@router.get("", response_model=APIResponse[List[BOQItemOut]])
async def list_boq_items(
    boq_element_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT])),
):
    service = BOQItemService(db)
    items = await service.get_by_element(boq_element_id)
    return APIResponse.ok(data=[BOQItemOut.model_validate(i) for i in items], message="تم جلب العناصر بنجاح")


@router.post("", response_model=APIResponse[BOQItemOut])
async def link_boq_item(
    item_in: BOQItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    boq_element_service = BOQElementService(db)
    element = await boq_element_service.get_by_id(item_in.boq_element_id)
    if not element:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="عنصر BOQ غير موجود")

    item_service = BOQItemService(db)
    item = await item_service.create_or_update(
        boq_element_id=item_in.boq_element_id,
        price_ref_id=item_in.price_ref_id,
        unit_price=element.quantity * float(item_in.unit_price) if item_in.unit_price else 0,
        quantity=element.quantity,
    )
    return APIResponse.ok(data=BOQItemOut.model_validate(item), message="تم ربط العنصر بالسعر بنجاح")


@router.delete("/{item_id}", response_model=APIResponse)
async def delete_boq_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    service = BOQItemService(db)
    deleted = await service.delete(item_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="العنصر غير موجود")
    return APIResponse.ok(message="تم حذف العنصر بنجاح")