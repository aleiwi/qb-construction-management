from datetime import datetime
from enum import Enum
from sqlalchemy import String, DateTime, Integer, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class PaymentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    PAID = "paid"
    REJECTED = "rejected"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    contract_id: Mapped[int] = mapped_column(Integer, ForeignKey("contracts.id", ondelete="RESTRICT"), nullable=False, index=True)
    stage_id: Mapped[int] = mapped_column(Integer, ForeignKey("stages.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    retention_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    net_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(String(50), default=PaymentStatus.PENDING, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str] = mapped_column(String(500), nullable=True)
    approved_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    contract: Mapped["Contract"] = relationship("Contract", lazy="selectin")
    stage: Mapped["Stage"] = relationship("Stage", lazy="selectin")
    approver: Mapped["User"] = relationship("User", lazy="selectin")


from app.models.contract import Contract
from app.models.stage import Stage
from app.models.user import User