from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from app.models.user import User
from app.models.user_project import UserProject
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(select(User).filter(User.id == user_id))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).filter(User.email == email))
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        result = await self.db.execute(select(User).offset(skip).limit(limit))
        return result.scalars().all()

    async def get_project_ids(self, user_id: int) -> List[int]:
        result = await self.db.execute(
            select(UserProject.project_id).filter(UserProject.user_id == user_id)
        )
        return [row[0] for row in result.all()]

    async def set_project_ids(self, user_id: int, project_ids: Optional[List[int]]) -> None:
        await self.db.execute(delete(UserProject).where(UserProject.user_id == user_id))
        for pid in project_ids or []:
            self.db.add(UserProject(user_id=user_id, project_id=pid))
        await self.db.commit()

    async def create(self, user_in: UserCreate) -> User:
        user = User(
            email=user_in.email,
            full_name=user_in.full_name,
            hashed_password=get_password_hash(user_in.password),
            role=user_in.role,
            is_active=True,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        await self.set_project_ids(user.id, user_in.project_ids)
        await self.db.refresh(user)
        return user

    async def update(self, user: User, user_in: UserUpdate) -> User:
        update_data = user_in.model_dump(exclude_unset=True)
        project_ids = update_data.pop("project_ids", None)
        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

        for field, value in update_data.items():
            setattr(user, field, value)

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        if project_ids is not None:
            await self.set_project_ids(user.id, project_ids)
            await self.db.refresh(user)
        return user
