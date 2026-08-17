from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class BOQItemBase(BaseModel):
    quantity: float = Field(default=0.0, ge=0)


class BOQItemCreate(BOQItemBase):
    boq_element_id: int
    price_ref_id: int
    unit_price: Optional[float] = Field(None, ge=0)


class BOQItemUpdate(BaseModel):
    quantity: Optional[float] = Field(None, ge=0)
    price_ref_id: Optional[int] = None


class PriceRefOut(BaseModel):
    id: int
    element_type: str
    description: Optional[str]
    unit: str
    unit_price: float

    model_config = ConfigDict(from_attributes=True)


class BOQElementRefForItem(BaseModel):
    id: int
    element_type: str
    quantity: float
    unit: str

    model_config = ConfigDict(from_attributes=True)


class BOQItemOut(BOQItemBase):
    id: int
    boq_element_id: int
    price_ref_id: int
    unit_price: float
    total_price: float
    created_at: datetime
    boq_element: Optional[BOQElementRefForItem] = None
    price_ref: Optional[PriceRefOut] = None

    model_config = ConfigDict(from_attributes=True)