from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.contractor import ContractorCreate, ContractorUpdate, ContractorOut, ContractorListOut
from app.schemas.response import APIResponse
from app.services.contractor_service import ContractorService, ContractorNotFoundException
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/contractors", tags=["Contractors"])


@router.get("", response_model=APIResponse[List[ContractorListOut]])
async def list_contractors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT])),
):
    contractor_service = ContractorService(db)
    results = await contractor_service.get_all_with_counts(skip=(page - 1) * page_size, limit=page_size)
    items = []
    for row in results:
        c = row[0]
        items.append(ContractorListOut(
            id=c.id,
            company_name=c.company_name,
            contact_person=c.contact_person,
            email=c.email,
            phone=c.phone,
            specialization=c.specialization,
            notes=c.notes,
            is_active=c.is_active,
            created_at=c.created_at,
            updated_at=c.updated_at,
            contracts_count=row[1],
            total_contract_value=float(row[2]),
        ))
    return APIResponse.ok(data=items, message="تم جلب قائمة المقاولين بنجاح")


@router.post("", response_model=APIResponse[ContractorOut])
async def create_contractor(
    contractor_in: ContractorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    contractor_service = ContractorService(db)
    existing = await contractor_service.get_by_email(contractor_in.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="البريد الإلكتروني مسجل بالفعل")
    contractor = await contractor_service.create(contractor_in)
    return APIResponse.ok(data=ContractorOut.model_validate(contractor), message="تم إضافة المقاول بنجاح")


@router.get("/{contractor_id}", response_model=APIResponse[ContractorOut])
async def get_contractor(
    contractor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT, UserRole.CONTRACTOR])),
):
    contractor_service = ContractorService(db)
    contractor = await contractor_service.get_by_id(contractor_id)
    if not contractor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المقاول غير موجود")

    if current_user.role == UserRole.CONTRACTOR and current_user.id != contractor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ليس لديك الصلاحية الكافية")

    return APIResponse.ok(data=ContractorOut.model_validate(contractor), message="تم جلب بيانات المقاول بنجاح")


@router.put("/{contractor_id}", response_model=APIResponse[ContractorOut])
async def update_contractor(
    contractor_id: int,
    contractor_in: ContractorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    contractor_service = ContractorService(db)
    contractor = await contractor_service.get_by_id(contractor_id)
    if not contractor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المقاول غير موجود")
    updated = await contractor_service.update(contractor, contractor_in)
    return APIResponse.ok(data=ContractorOut.model_validate(updated), message="تم تحديث بيانات المقاول بنجاح")


@router.delete("/{contractor_id}", response_model=APIResponse)
async def delete_contractor(
    contractor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    contractor_service = ContractorService(db)
    try:
        await contractor_service.delete(contractor_id)
    except ContractorNotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المقاول غير موجود")
    return APIResponse.ok(message="تم حذف المقاول بنجاح")