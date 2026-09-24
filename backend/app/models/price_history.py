from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Integer, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class PriceHistory(Base):
    """Immutable timeline of price-library changes (idea from the legacy
    QuantumBuild price_history table). Every create/update/delete of a
    PriceLibrary row appends here — the library itself keeps only current."""

    __tablename__ = "price_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    # Deliberately NO foreign key: history must survive price deletion and
    # keep pointing at the original row id for the timeline endpoint.
    price_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    element_type: Mapped[str] = mapped_column(String(50), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), default="م2", nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    change: Mapped[str] = mapped_column(String(20), nullable=False)  # create|update|delete
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
