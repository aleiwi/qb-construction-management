from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserOut
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.config import settings
from app.services.user_service import UserService
from app.services.audit_log_service import AuditLogService

class InvalidCredentialsException(Exception):
    pass

class InactiveUserException(Exception):
    pass

class InvalidTokenException(Exception):
    pass

class AccountLockedException(Exception):
    pass

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_service = UserService(db)
        self.audit_service = AuditLogService(db)

    async def _check_lockout(self, user: User) -> None:
        if user.locked_until and user.locked_until > datetime.utcnow():
            remaining = (user.locked_until - datetime.utcnow()).total_seconds() / 60
            raise AccountLockedException(
                f"تم قفل الحساب مؤقتاً بسبب محاولات فاشلة متكررة، حاول بعد {int(remaining) + 1} دقيقة"
            )

    async def _register_failed_attempt(self, user: User, ip_address: Optional[str] = None) -> None:
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
            user.failed_login_attempts = 0
            await self.db.commit()
            await self.audit_service.log(
                user_id=user.id,
                action="user_locked",
                entity_type="user",
                entity_id=user.id,
                old_value={"failed_login_attempts": settings.MAX_FAILED_LOGIN_ATTEMPTS},
                new_value={"locked_until": user.locked_until.isoformat()},
                ip_address=ip_address,
            )
            raise AccountLockedException(
                f"تم قفل الحساب بسبب {settings.MAX_FAILED_LOGIN_ATTEMPTS} محاولات فاشلة، حاول بعد {settings.ACCOUNT_LOCKOUT_MINUTES} دقيقة"
            )
        await self.db.commit()

    async def authenticate(self, login_data: LoginRequest, ip_address: Optional[str] = None) -> TokenResponse:
        user = await self.user_service.get_by_email(login_data.email)
        if not user or not verify_password(login_data.password, user.hashed_password):
            if user:
                await self._register_failed_attempt(user, ip_address)
            raise InvalidCredentialsException("البريد الإلكتروني أو كلمة المرور غير صحيحة")

        await self._check_lockout(user)

        if not user.is_active:
            raise InactiveUserException("هذا الحساب معطل حالياً")

        if user.failed_login_attempts:
            user.failed_login_attempts = 0
            user.locked_until = None
            await self.db.commit()

        access_token = create_access_token(subject=user.id)
        refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserOut.model_validate(user)
        )

    async def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        try:
            payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            token_type = payload.get("type")
            user_id = payload.get("sub")
            if token_type != "refresh" or not user_id:
                raise InvalidTokenException("رمز التحديث غير صالح")
        except JWTError:
            raise InvalidTokenException("رمز التحديث انتهت صلاحيته أو غير صالح")

        user = await self.user_service.get_by_id(int(user_id))
        if not user or not user.is_active:
            raise InactiveUserException("المستخدم غير موجود أو غير نشط")

        await self._check_lockout(user)

        new_access_token = create_access_token(subject=user.id)
        new_refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            user=UserOut.model_validate(user)
        )
