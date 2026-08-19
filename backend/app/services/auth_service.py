from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserOut
from app.core.security import verify_password, create_access_token, create_refresh_token, get_password_hash
from app.core.config import settings
from app.services.user_service import UserService
from app.services.audit_log_service import AuditLogService
from app.services.email_service import send_activation_email, send_password_reset_email

class InvalidCredentialsException(Exception):
    pass

class InactiveUserException(Exception):
    pass

class InvalidTokenException(Exception):
    pass

class AccountLockedException(Exception):
    pass

class InvalidPasswordException(Exception):
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

    def _email_token(self, user_id: int, token_type: str, expires_minutes: int) -> str:
        payload = {
            "sub": str(user_id),
            "type": token_type,
            "exp": datetime.utcnow() + timedelta(minutes=expires_minutes),
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    async def request_password_reset(self, email: str) -> bool:
        """Send a password reset email. Always returns True to avoid email enumeration."""
        user = await self.user_service.get_by_email(email)
        if not user or not user.is_active:
            return True
        token = self._email_token(
            user.id, "password_reset", settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
        )
        send_password_reset_email(user.email, user.full_name, token)
        return True

    async def reset_password(self, token: str, new_password: str) -> None:
        user = await self._user_from_email_token(token, "password_reset")
        user.hashed_password = get_password_hash(new_password)
        user.failed_login_attempts = 0
        user.locked_until = None
        await self.db.commit()
        await self.audit_service.log(
            user_id=user.id,
            action="password_reset",
            entity_type="user",
            entity_id=user.id,
        )

    async def verify_email(self, token: str) -> None:
        user = await self._user_from_email_token(token, "email_verify")
        user.is_email_verified = True
        await self.db.commit()

    async def send_activation_email(self, user_id: int) -> bool:
        user = await self.user_service.get_by_id(user_id)
        if not user:
            return False
        token = self._email_token(
            user.id, "email_verify", settings.EMAIL_TOKEN_EXPIRE_MINUTES
        )
        return send_activation_email(user.email, user.full_name, token)

    async def change_password(self, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.hashed_password):
            raise InvalidPasswordException("كلمة المرور الحالية غير صحيحة")
        user.hashed_password = get_password_hash(new_password)
        user.failed_login_attempts = 0
        user.locked_until = None
        await self.db.commit()
        await self.audit_service.log(
            user_id=user.id,
            action="password_changed",
            entity_type="user",
            entity_id=user.id,
        )

    async def _user_from_email_token(self, token: str, expected_type: str) -> User:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != expected_type or not payload.get("sub"):
                raise InvalidTokenException("الرابط غير صالح")
            user_id = int(payload["sub"])
        except JWTError:
            raise InvalidTokenException("الرابط انتهت صلاحيته أو غير صالح")
        user = await self.user_service.get_by_id(user_id)
        if not user:
            raise InvalidTokenException("الرابط غير صالح")
        return user
