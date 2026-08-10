from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest
from app.schemas.user import UserOut
from app.schemas.auth_context import UserContext, ContractorContext
from app.schemas.response import APIResponse
from app.services.auth_service import AuthService, InvalidCredentialsException, InactiveUserException, InvalidTokenException
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.building import Building
from app.models.contractor import Contractor
from app.models.contract import Contract

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=APIResponse[TokenResponse])
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    تسجيل الدخول وإصدار رموز JWT Access Token و Refresh Token
    """
    auth_service = AuthService(db)
    try:
        token_response = await auth_service.authenticate(login_data)
        return APIResponse.ok(data=token_response, message="تم تسجيل الدخول بنجاح")
    except InvalidCredentialsException as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except InactiveUserException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.post("/refresh", response_model=APIResponse[TokenResponse])
async def refresh_token(request: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """
    تحديث رمز الوصول عبر رمز التحديث Refresh Token
    """
    auth_service = AuthService(db)
    try:
        token_response = await auth_service.refresh_access_token(request.refresh_token)
        return APIResponse.ok(data=token_response, message="تم تحديث الرمز بنجاح")
    except InvalidTokenException as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except InactiveUserException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.get("/me", response_model=APIResponse[UserOut])
async def get_me(current_user: User = Depends(get_current_user)):
    """
    جلب بيانات المستخدم الحالي وصلاحياته
    """
    return APIResponse.ok(data=UserOut.model_validate(current_user), message="تم جلب البيانات بنجاح")


@router.get("/me/context", response_model=APIResponse[UserContext])
async def get_my_context(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب سياق المستخدم — بيانات مرتبطة بدوره (المشروع، العقد، المقاول ...)
    """
    ctx = UserContext(
        role=current_user.role.value,
        full_name=current_user.full_name,
        email=current_user.email,
    )

    # Count all accessible data
    result = await db.execute(select(Project))
    all_projects = result.scalars().all()
    ctx.total_projects = len(all_projects)

    result = await db.execute(select(Contract))
    all_contracts = result.scalars().all()
    ctx.total_contracts = len(all_contracts)

    # Role-specific enrichment
    if current_user.role == UserRole.CONTRACTOR:
        # Try to find a contractor whose company_name matches the user's full_name
        result = await db.execute(
            select(Contractor).filter(Contractor.company_name.ilike(f"%{current_user.full_name}%"))
        )
        contractor = result.scalars().first()
        if contractor:
            ctx.linked_contractor = ContractorContext(
                company_name=contractor.company_name,
                contract_title="",
                contract_value=0,
                contract_status="",
            )
            # Get their first contract
            result = await db.execute(
                select(Contract).filter(Contract.contractor_id == contractor.id).limit(1)
            )
            contract = result.scalars().first()
            if contract:
                ctx.linked_contractor.contract_title = contract.title
                ctx.linked_contractor.contract_value = float(contract.total_value)
                ctx.linked_contractor.contract_status = contract.status

    # Link to first project for PM/Engineer
    if current_user.role in (UserRole.PROJECT_MANAGER, UserRole.ENGINEER):
        if all_projects:
            ctx.linked_project = all_projects[0].name
            # Get first building of first project
            result = await db.execute(
                select(Building).filter(Building.project_id == all_projects[0].id).limit(1)
            )
            building = result.scalars().first()
            if building:
                ctx.linked_building = building.name

    return APIResponse.ok(data=ctx, message="تم جلب السياق بنجاح")
