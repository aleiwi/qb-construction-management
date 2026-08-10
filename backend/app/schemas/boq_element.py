from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.boq_element import ClassificationStatus, ElementType


class BOQElementBase(BaseModel):
    element_type: ElementType = ElementType.OTHER
    source_layer_name: str
    quantity: float = Field(default=0.0, ge=0)
    unit: str = "م2"
    dimensions_json: Optional[dict] = None


class BOQElementCreate(BOQElementBase):
    drawing_id: int


class BOQElementUpdate(BaseModel):
    element_type: Optional[ElementType] = None
    quantity: Optional[float] = Field(None, ge=0)
    unit: Optional[str] = None
    dimensions_json: Optional[dict] = None


class BOQElementClassify(BaseModel):
    element_type: ElementType
    classification_status: ClassificationStatus = ClassificationStatus.MANUALLY_CLASSIFIED


class BOQElementOut(BOQElementBase):
    id: int
    drawing_id: int
    classification_status: ClassificationStatus
    classified_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BOQElementWithPrice(BOQElementOut):
    unit_price: Optional[float] = 0.0
    total_price: Optional[float] = 0.0


class DrawingRef(BaseModel):
    id: int
    file_name: str

    model_config = ConfigDict(from_attributes=True)


class BOQElementReviewOut(BOQElementOut):
    drawing: Optional[DrawingRef] = None
    classified_by_user: Optional[str] = None