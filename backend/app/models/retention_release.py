from datetime import datetime
from enum import Enum
from sqlalchemy import String, DateTime, Integer, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ReleaseStatus(str, Enum):
    HELD = "held"
    RELEASED = "released"


class RetentionRelease(Base):
    __tablename__ = "retention_releases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    contract_id: Mapped[int] = mapped_column(Integer, ForeignKey("contracts.id", ondelete="RESTRICT"), nullable=False, index=True)
    retained_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    maintenance_period_end_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    release_status: Mapped[ReleaseStatus] = mapped_column(String(50), default=ReleaseStatus.HELD, nullable=False)
    released_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    released_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    contract: Mapped["Contract"] = relationship("Contract")
    releaser: Mapped["User"] = relationship("User")


from app.models.contract import Contract
from app.models.user import User