from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.price_library import PriceLibraryCreate, PriceLibraryUpdate, PriceLibraryOut
from app.schemas.response import APIResponse
from app.services.price_library_service import PriceLibraryService
from app.services.audit_log_service import AuditLogService
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/price-library", tags=["Price Library"])


@router.get("", response_model=APIResponse[List[PriceLibraryOut]])
async def list_prices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT])),
):
    service = PriceLibraryService(db)
    prices = await service.get_all(skip=skip, limit=limit)
    return APIResponse.ok(data=[PriceLibraryOut.model_validate(p) for p in prices], message="تم جلب المكتبة السعرية بنجاح")


@router.post("", response_model=APIResponse[PriceLibraryOut])
async def create_or_update_price(
    price_in: PriceLibraryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    service = PriceLibraryService(db)
    existing = await service.get_by_element_type(price_in.element_type)
    old_val = {"unit_price": float(existing.unit_price), "unit": existing.unit} if existing else None

    price = await service.upsert(
        element_type=price_in.element_type,
        unit=price_in.unit,
        unit_price=price_in.unit_price,
        description=price_in.description,
    )

    audit = AuditLogService(db)
    await audit.log(
        user_id=current_user.id,
        action="upsert_price",
        entity_type="price_library",
        entity_id=price.id,
        old_value=old_val,
        new_value={"unit_price": price_in.unit_price, "unit": price_in.unit, "description": price_in.description},
    )

    return APIResponse.ok(data=PriceLibraryOut.model_validate(price), message="تم حفظ السعر بنجاح")


@router.put("/{price_id}", response_model=APIResponse[PriceLibraryOut])
async def update_price(
    price_id: int,
    price_in: PriceLibraryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    service = PriceLibraryService(db)
    price = await service.get_by_id(price_id)
    if not price:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="السعر غير موجود")
    old_val = {"unit_price": float(price.unit_price), "unit": price.unit, "description": price.description}
    update_data = price_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(price, field, value)
    service.db.add(price)
    await service.db.commit()
    await service.db.refresh(price)

    audit = AuditLogService(db)
    await audit.log(
        user_id=current_user.id,
        action="update_price",
        entity_type="price_library",
        entity_id=price_id,
        old_value=old_val,
        new_value=update_data,
    )

    return APIResponse.ok(data=PriceLibraryOut.model_validate(price), message="تم تحديث السعر بنجاح")


@router.delete("/{price_id}", response_model=APIResponse)
async def delete_price(
    price_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    service = PriceLibraryService(db)
    price = await service.get_by_id(price_id)
    if not price:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="السعر غير موجود")
    old_val = {"unit_price": float(price.unit_price), "unit": price.unit, "element_type": price.element_type}
    deleted = await service.delete(price_id)

    if deleted:
        audit = AuditLogService(db)
        await audit.log(
            user_id=current_user.id,
            action="delete_price",
            entity_type="price_library",
            entity_id=price_id,
            old_value=old_val,
            new_value=None,
        )

    return APIResponse.ok(message="تم حذف السعر بنجاح")