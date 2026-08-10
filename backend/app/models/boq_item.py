from datetime import datetime
from sqlalchemy import Integer, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class BOQItem(Base):
    __tablename__ = "boq_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    boq_element_id: Mapped[int] = mapped_column(Integer, ForeignKey("boq_elements.id", ondelete="CASCADE"), nullable=False, index=True)
    price_ref_id: Mapped[int] = mapped_column(Integer, ForeignKey("price_library.id", ondelete="RESTRICT"), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(15, 4), default=0.0, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    boq_element: Mapped["BOQElement"] = relationship("BOQElement", back_populates="boq_items", lazy="selectin")
    price_ref: Mapped["PriceLibrary"] = relationship("PriceLibrary", lazy="selectin")