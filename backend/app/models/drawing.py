from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, DateTime, Integer, Numeric, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class DrawingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Drawing(Base):
    __tablename__ = "drawings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    building_id: Mapped[int] = mapped_column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_job_id: Mapped[int] = mapped_column(Integer, ForeignKey("batch_jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[DrawingStatus] = mapped_column(String(50), default=DrawingStatus.PENDING, nullable=False)
    elements_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    classified_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    unclassified_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    processing_time: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0, nullable=False)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    uploaded_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    building: Mapped["Building"] = relationship("Building")
    batch_job: Mapped["BatchJob"] = relationship("BatchJob", back_populates="drawings", lazy="selectin")
    uploaded_by_user: Mapped["User"] = relationship("User")
    boq_elements: Mapped[list["BOQElement"]] = relationship("BOQElement", back_populates="drawing", lazy="selectin")