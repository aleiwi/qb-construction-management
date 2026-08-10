from datetime import datetime
from sqlalchemy import String, DateTime, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class PriceLibrary(Base):
    __tablename__ = "price_library"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    element_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    unit: Mapped[str] = mapped_column(String(20), default="م2", nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)