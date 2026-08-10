from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, DateTime, Integer, Numeric, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class BOQProjectStatus(str, Enum):
    DRAFT = "draft"
    FINALIZED = "finalized"
    APPROVED = "approved"


class BOQProject(Base):
    __tablename__ = "boq_projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    total_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_cost: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    base_cost: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    markup_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0, nullable=False)
    contingency_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0, nullable=False)
    status: Mapped[BOQProjectStatus] = mapped_column(String(50), default=BOQProjectStatus.DRAFT, nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
