from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentOut, PaymentListOut
from app.schemas.response import APIResponse
from app.services.payment_service import PaymentService
from app.dependencies.auth import require_roles, check_entity_access
from app.models.user import User, UserRole

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("", response_model=APIResponse[List[PaymentListOut]])
async def list_payments(
    contract_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT])),
):
    service = PaymentService(db)
    if contract_id:
        await check_entity_access(db, current_user, "contract", contract_id)
        payments = await service.get_by_contract(contract_id)
        items = []
        for p in payments:
            stage_name = p.stage.name if p.stage else None
            contract_title = p.contract.title if p.contract else None
            items.append(PaymentListOut(
                id=p.id, contract_id=p.contract_id, stage_id=p.stage_id,
                amount=float(p.amount), retention_amount=float(p.retention_amount),
                net_amount=float(p.net_amount), status=p.status,
                paid_at=p.paid_at, contract_title=contract_title,
                stage_name=stage_name, created_at=p.created_at,
            ))
    else:
        results = await service.get_all_with_names(skip=(page - 1) * page_size, limit=page_size)
        items = []
        for row in results:
            p = row[0]
            items.append(PaymentListOut(
                id=p.id, contract_id=p.contract_id, stage_id=p.stage_id,
                amount=float(p.amount), retention_amount=float(p.retention_amount),
                net_amount=float(p.net_amount), status=p.status,
                paid_at=p.paid_at, contract_title=row[1], stage_name=row[2],
                created_at=p.created_at,
            ))
    return APIResponse.ok(data=items, message="تم جلب الدفعات بنجاح")


@router.post("", response_model=APIResponse[PaymentOut])
async def create_payment(
    payment_in: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT])),
):
    await check_entity_access(db, current_user, "contract", payment_in.contract_id)
    service = PaymentService(db)
    payment = await service.create(payment_in.contract_id, payment_in.stage_id, payment_in.notes)
    return APIResponse.ok(data=PaymentOut.model_validate(payment), message=f"تم حساب الدفعة: {payment.net_amount} ر.س")


@router.get("/{payment_id}", response_model=APIResponse[PaymentOut])
async def get_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT, UserRole.CONTRACTOR])),
):
    await check_entity_access(db, current_user, "payment", payment_id)
    service = PaymentService(db)
    payment = await service.get_by_id(payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الدفعة غير موجودة")
    return APIResponse.ok(data=PaymentOut.model_validate(payment), message="تم جلب بيانات الدفعة بنجاح")


@router.patch("/{payment_id}/approve", response_model=APIResponse[PaymentOut])
async def approve_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    await check_entity_access(db, current_user, "payment", payment_id)
    service = PaymentService(db)
    payment = await service.get_by_id(payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الدفعة غير موجودة")
    try:
        payment = await service.approve(payment, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return APIResponse.ok(data=PaymentOut.model_validate(payment), message="تم اعتماد الدفعة بنجاح")


@router.patch("/{payment_id}/mark-paid", response_model=APIResponse[PaymentOut])
async def mark_paid(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.ACCOUNTANT])),
):
    await check_entity_access(db, current_user, "payment", payment_id)
    service = PaymentService(db)
    payment = await service.get_by_id(payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الدفعة غير موجودة")
    payment = await service.mark_paid(payment, current_user.id)
    return APIResponse.ok(data=PaymentOut.model_validate(payment), message="تم تسجيل الدفعة كمدفوعة")


@router.delete("/{payment_id}", response_model=APIResponse)
async def delete_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    await check_entity_access(db, current_user, "payment", payment_id)
    service = PaymentService(db)
    deleted = await service.delete(payment_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الدفعة غير موجودة")
    return APIResponse.ok(message="تم حذف الدفعة بنجاح")