from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, DateTime, Integer, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.task_model import Task


class ProjectStatus(str, Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String(500), nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(String(50), default=ProjectStatus.PLANNING, nullable=False)
    # Per-project financial rates (fractions, e.g. 0.15). NULL = global default
    # (idea from the legacy SettingsPage: overhead/profit/VAT per project).
    overhead_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    profit_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    contingency_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    vat_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    buildings: Mapped[list["Building"]] = relationship("Building", back_populates="project", lazy="selectin")

    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="project", lazy="selectin")
