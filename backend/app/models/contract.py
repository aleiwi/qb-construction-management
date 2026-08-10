from datetime import datetime
from enum import Enum
from sqlalchemy import String, DateTime, Integer, Numeric, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ContractStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    TERMINATED = "terminated"


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    contractor_id: Mapped[int] = mapped_column(Integer, ForeignKey("contractors.id", ondelete="RESTRICT"), nullable=False, index=True)
    building_id: Mapped[int] = mapped_column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    total_value: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    retention_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=10.0, nullable=False)
    status: Mapped[ContractStatus] = mapped_column(String(50), default=ContractStatus.DRAFT, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    contractor: Mapped["Contractor"] = relationship("Contractor", back_populates="contracts", lazy="selectin")
    building: Mapped["Building"] = relationship("Building", lazy="selectin")


from app.models.contractor import Contractor
from app.models.building import Building