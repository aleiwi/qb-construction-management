from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.rate_limit import check_login_rate_limit
from app.core.config import settings
from app.schemas.auth import (
    LoginRequest, TokenResponse, RefreshTokenRequest,
    ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest,
    ChangePasswordRequest,
)
from app.schemas.user import UserOut
from app.schemas.auth_context import UserContext, ContractorContext
from app.schemas.response import APIResponse
from app.services.auth_service import AuthService, InvalidCredentialsException, InactiveUserException, InvalidTokenException, AccountLockedException, InvalidPasswordException
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.building import Building
from app.models.contractor import Contractor
from app.models.contract import Contract

router = APIRouter(prefix="/auth", tags=["Authentication"])


class OAuthTokenRequest(BaseModel):
    access_token: str


@router.get("/oauth/providers")
async def list_oauth_providers():
    """قائمة مزودات تسجيل الدخول الخارجي المفعّلة (لأزرار الواجهة)."""
    from app.services.social_auth_service import configured_providers
    return APIResponse.ok(data=configured_providers(), message="تم جلب المزودات بنجاح")


@router.get("/oauth/{provider}", include_in_schema=False)
async def oauth_authorize(provider: str):
    """تحويل المتصفح إلى صفحة تفويض المزود الخارجي."""
    from app.services.social_auth_service import build_authorize_url, OAuthNotConfiguredError
    try:
        url = build_authorize_url(provider)
    except OAuthNotConfiguredError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return RedirectResponse(url=url)


@router.get("/oauth/{provider}/callback", include_in_schema=False)
async def oauth_callback(
    provider: str,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """نقطة الرجوع من المزود: تبادل الرمز، الدخول/الربط/الإنشاء، ثم إعادة التوجيه للواجهة بالرموز."""
    from app.services.social_auth_service import (
        verify_state_token, exchange_code, social_login, issue_tokens,
        OAuthStateError, OAuthExchangeError, OAuthNotConfiguredError,
    )
    frontend_base = settings.FRONTEND_URL.rstrip("/")
    if error or not code or not state:
        return RedirectResponse(url=f"{frontend_base}/oauth-success?error=oauth_denied")
    try:
        verify_state_token(state, provider)
        provider_user_id, email, name = await exchange_code(provider, code)
        user, _ = await social_login(db, provider, provider_user_id, email, name)
    except (OAuthStateError, OAuthExchangeError, OAuthNotConfiguredError) as e:
        return RedirectResponse(url=f"{frontend_base}/oauth-success?error=oauth_failed&message={str(e)}")

    tokens = issue_tokens(user)
    return RedirectResponse(url=(
        f"{frontend_base}/oauth-success?access_token={tokens.access_token}"
        f"&refresh_token={tokens.refresh_token}"
    ))


@router.post("/oauth/{provider}/token", response_model=APIResponse[TokenResponse])
async def oauth_token_flow(
    provider: str,
    body: OAuthTokenRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """SPA flow: الواجهة تحصل على access_token من المزود وترسله هنا للدخول."""
    from app.services.social_auth_service import fetch_profile, social_login, issue_tokens, OAuthExchangeError, OAuthNotConfiguredError
    forwarded = request.headers.get("x-forwarded-for")
    ip_address = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else None)
    try:
        provider_user_id, email, name = await fetch_profile(provider, body.access_token)
        user, created = await social_login(db, provider, provider_user_id, email, name, ip_address=ip_address)
    except (OAuthExchangeError, OAuthNotConfiguredError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return APIResponse.ok(
        data=issue_tokens(user),
        message="تم إنشاء الحساب وربطه بنجاح" if created else "تم تسجيل الدخول بنجاح",
    )

@router.post("/login", response_model=APIResponse[TokenResponse])
async def login(
    login_data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_login_rate_limit),
):
    """
    تسجيل الدخول وإصدار رموز JWT Access Token و Refresh Token
    """
    auth_service = AuthService(db)
    forwarded = request.headers.get("x-forwarded-for")
    ip_address = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else None)
    try:
        token_response = await auth_service.authenticate(login_data, ip_address=ip_address)
        return APIResponse.ok(data=token_response, message="تم تسجيل الدخول بنجاح")
    except AccountLockedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except InvalidCredentialsException as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except InactiveUserException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.post("/refresh", response_model=APIResponse[TokenResponse])
async def refresh_token(
    request: RefreshTokenRequest,
    _: Request,
    db: AsyncSession = Depends(get_db),
    __: None = Depends(check_login_rate_limit),
):
    """
    تحديث رمز الوصول عبر رمز التحديث Refresh Token
    """
    auth_service = AuthService(db)
    try:
        token_response = await auth_service.refresh_access_token(request.refresh_token)
        return APIResponse.ok(data=token_response, message="تم تحديث الرمز بنجاح")
    except AccountLockedException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
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

@router.post("/change-password", response_model=APIResponse)
async def change_password(
    request: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    تغيير كلمة مرور المستخدم الحالي
    """
    auth_service = AuthService(db)
    try:
        await auth_service.change_password(current_user, request.current_password, request.new_password)
        return APIResponse.ok(message="تم تغيير كلمة المرور بنجاح")
    except InvalidPasswordException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/forgot-password", response_model=APIResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_login_rate_limit),
):
    """
    إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني
    """
    auth_service = AuthService(db)
    await auth_service.request_password_reset(request.email)
    return APIResponse.ok(message="إذا كان البريد مسجلاً لدينا، ستصل رسالة إعادة التعيين خلال دقائق")

@router.post("/reset-password", response_model=APIResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    تعيين كلمة مرور جديدة عبر الرابط المرسل بالبريد
    """
    auth_service = AuthService(db)
    try:
        await auth_service.reset_password(request.token, request.new_password)
        return APIResponse.ok(message="تم تحديث كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن")
    except InvalidTokenException as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

@router.post("/verify-email", response_model=APIResponse)
async def verify_email(
    request: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    تفعيل الحساب عبر الرابط المرسل بالبريد
    """
    auth_service = AuthService(db)
    try:
        await auth_service.verify_email(request.token)
        return APIResponse.ok(message="تم تفعيل الحساب بنجاح")
    except InvalidTokenException as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


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

    # M4: project-level access (admin has full access → empty means "all")
    from app.services.user_service import UserService
    if current_user.role != UserRole.ADMIN:
        ctx.allowed_project_ids = await UserService(db).get_project_ids(current_user.id)

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
