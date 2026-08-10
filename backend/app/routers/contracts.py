from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.contract import ContractCreate, ContractUpdate, ContractOut, ContractListOut
from app.schemas.response import APIResponse
from app.services.contract_service import ContractService, ContractNotFoundException, ContractBuildingNotFoundException
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/contracts", tags=["Contracts"])


@router.get("", response_model=APIResponse[List[ContractListOut]])
async def list_contracts(
    contractor_id: Optional[int] = Query(None),
    building_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT])),
):
    contract_service = ContractService(db)
    if contractor_id or building_id:
        contracts = await contract_service.get_all(skip=0, limit=1000)
        filtered = [c for c in contracts if (not contractor_id or c.contractor_id == contractor_id) and (not building_id or c.building_id == building_id)]
        items = [ContractListOut(
            id=c.id, title=c.title, description=c.description,
            total_value=float(c.total_value), retention_percent=float(c.retention_percent),
            status=c.status.value if hasattr(c.status, 'value') else c.status,
            start_date=c.start_date, end_date=c.end_date,
            contractor_id=c.contractor_id, building_id=c.building_id,
            created_at=c.created_at, updated_at=c.updated_at,
            contractor_name=getattr(c, 'contractor_name', None),
            building_name=getattr(c, 'building_name', None),
        ) for c in filtered]
    else:
        results = await contract_service.get_all_with_names(skip=(page - 1) * page_size, limit=page_size)
        items = []
        for row in results:
            c = row[0]
            items.append(ContractListOut(
                id=c.id, title=c.title, description=c.description,
                total_value=float(c.total_value), retention_percent=float(c.retention_percent),
                status=c.status.value if hasattr(c.status, 'value') else c.status,
                start_date=c.start_date, end_date=c.end_date,
                contractor_id=c.contractor_id, building_id=c.building_id,
                created_at=c.created_at, updated_at=c.updated_at,
                contractor_name=row[1],
                building_name=row[2],
            ))
    return APIResponse.ok(data=items, message="تم جلب قائمة العقود بنجاح")


@router.post("", response_model=APIResponse[ContractOut])
async def create_contract(
    contract_in: ContractCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    contract_service = ContractService(db)
    try:
        contract = await contract_service.create(contract_in)
    except ContractBuildingNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return APIResponse.ok(data=ContractOut.model_validate(contract), message="تم إنشاء العقد بنجاح")


@router.get("/{contract_id}", response_model=APIResponse[ContractOut])
async def get_contract(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT, UserRole.CONTRACTOR])),
):
    contract_service = ContractService(db)
    contract = await contract_service.get_by_id(contract_id)
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="العقد غير موجود")
    return APIResponse.ok(data=ContractOut.model_validate(contract), message="تم جلب بيانات العقد بنجاح")


@router.put("/{contract_id}", response_model=APIResponse[ContractOut])
async def update_contract(
    contract_id: int,
    contract_in: ContractUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    contract_service = ContractService(db)
    contract = await contract_service.get_by_id(contract_id)
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="العقد غير موجود")
    updated = await contract_service.update(contract, contract_in)
    return APIResponse.ok(data=ContractOut.model_validate(updated), message="تم تحديث العقد بنجاح")


@router.delete("/{contract_id}", response_model=APIResponse)
async def delete_contract(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    contract_service = ContractService(db)
    try:
        await contract_service.delete(contract_id)
    except ContractNotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="العقد غير موجود")
    return APIResponse.ok(message="تم حذف العقد بنجاح")