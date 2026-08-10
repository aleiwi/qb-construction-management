from datetime import datetime
from enum import Enum
from sqlalchemy import String, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class QCStatus(str, Enum):
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"


class QualityCheck(Base):
    __tablename__ = "quality_checks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    stage_id: Mapped[int] = mapped_column(Integer, ForeignKey("stages.id", ondelete="RESTRICT"), nullable=False, index=True)
    inspected_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[QCStatus] = mapped_column(String(20), default=QCStatus.PENDING, nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    stage: Mapped["Stage"] = relationship("Stage", lazy="selectin")
    inspector: Mapped["User"] = relationship("User", lazy="selectin")


from app.models.stage import Stage
from app.models.user import User