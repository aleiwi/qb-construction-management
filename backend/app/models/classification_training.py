from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Integer, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.boq_element import JSONText


class ClassificationTraining(Base):
    __tablename__ = "classification_training"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    layer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    geometry_type: Mapped[str] = mapped_column(String(100), nullable=False)
    dimensions_json: Mapped[dict] = mapped_column(JSONText, nullable=True)
    auto_classified_type: Mapped[str] = mapped_column(String(50), nullable=True)
    manual_classification: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    classified_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    used_in_retraining: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
