from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserOut
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.config import settings
from app.services.user_service import UserService

class InvalidCredentialsException(Exception):
    pass

class InactiveUserException(Exception):
    pass

class InvalidTokenException(Exception):
    pass

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_service = UserService(db)

    async def authenticate(self, login_data: LoginRequest) -> TokenResponse:
        user = await self.user_service.get_by_email(login_data.email)
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise InvalidCredentialsException("البريد الإلكتروني أو كلمة المرور غير صحيحة")

        if not user.is_active:
            raise InactiveUserException("هذا الحساب معطل حالياً")

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

        new_access_token = create_access_token(subject=user.id)
        new_refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            user=UserOut.model_validate(user)
        )
