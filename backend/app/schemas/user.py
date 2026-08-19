from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    role: UserRole = UserRole.ENGINEER

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)
    project_ids: Optional[List[int]] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    project_ids: Optional[List[int]] = None

class UserOut(UserBase):
    id: int
    is_active: bool
    is_email_verified: bool
    project_ids: List[int] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
