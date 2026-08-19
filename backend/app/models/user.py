from datetime import datetime
from enum import Enum
from sqlalchemy import String, Boolean, DateTime, Enum as SQLEnum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class UserRole(str, Enum):
    ADMIN = "admin"
    PROJECT_MANAGER = "project_manager"
    ENGINEER = "engineer"
    ACCOUNTANT = "accountant"
    CONTRACTOR = "contractor"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.ENGINEER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default="0")
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False, server_default="0")
    locked_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    oauth_accounts: Mapped[list["OAuthAccount"]] = relationship("OAuthAccount", back_populates="user", cascade="all, delete-orphan")


from app.models.oauth_account import OAuthAccount
