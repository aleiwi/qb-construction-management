from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.schemas.response import APIResponse
from app.services.user_service import UserService
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/users", tags=["Users Management"])

@router.post("", response_model=APIResponse[UserOut])
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """
    إنشاء مستخدم جديد (مسموح للمدير Admin فقط)
    """
    user_service = UserService(db)
    existing_user = await user_service.get_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="البريد الإلكتروني مسجل بالفعل"
        )
    new_user = await user_service.create(user_in)
    # M3: send activation email with link to set the password (dev: logged to console)
    from app.services.auth_service import AuthService
    await AuthService(db).send_activation_email(new_user.id)
    return APIResponse.ok(data=UserOut.model_validate(new_user), message="تم إنشاء المستخدم بنجاح")

@router.get("", response_model=APIResponse[List[UserOut]])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))
):
    """
    عرض قائمة المستخدمين (مسموح للمدير ومدير المشروع)
    """
    user_service = UserService(db)
    users = await user_service.get_all(skip=skip, limit=limit)
    users_out = [UserOut.model_validate(u) for u in users]
    return APIResponse.ok(data=users_out, message="تم جلب المستخدمين بنجاح")
