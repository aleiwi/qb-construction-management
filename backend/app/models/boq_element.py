import json
from typing import Optional
from datetime import datetime
from enum import Enum
from sqlalchemy import String, DateTime, Integer, Numeric, Text, ForeignKey, TypeDecorator
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class JSONText(TypeDecorator):
    impl = Text
    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value, ensure_ascii=False)
        return None
    def process_result_value(self, value, dialect):
        if value is not None:
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return None
        return None


class ClassificationStatus(str, Enum):
    AUTO_CLASSIFIED = "auto_classified"
    MANUALLY_CLASSIFIED = "manually_classified"
    UNCLASSIFIED = "unclassified"


class ElementType(str, Enum):
    WALL = "wall"
    COLUMN = "column"
    SLAB = "slab"
    BEAM = "beam"
    FOUNDATION = "foundation"
    DOOR = "door"
    WINDOW = "window"
    STAIRS = "stairs"
    ROOF = "roof"
    PARTITION = "partition"
    OPENING = "opening"
    OTHER = "other"


class BOQElement(Base):
    __tablename__ = "boq_elements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    drawing_id: Mapped[int] = mapped_column(Integer, ForeignKey("drawings.id", ondelete="CASCADE"), nullable=False, index=True)
    element_type: Mapped[ElementType] = mapped_column(String(50), default=ElementType.OTHER, nullable=False)
    classification_status: Mapped[ClassificationStatus] = mapped_column(String(50), default=ClassificationStatus.UNCLASSIFIED, nullable=False)
    source_layer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(15, 4), default=0.0, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), default="م2", nullable=False)
    dimensions_json: Mapped[Optional[dict]] = mapped_column(JSONText, nullable=True)
    classified_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    drawing: Mapped["Drawing"] = relationship("Drawing", back_populates="boq_elements", lazy="selectin")
    classifier: Mapped["User"] = relationship("User", lazy="selectin")
    boq_items: Mapped[list["BOQItem"]] = relationship("BOQItem", back_populates="boq_element", lazy="selectin")