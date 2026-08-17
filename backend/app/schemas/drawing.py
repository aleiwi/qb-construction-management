from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class BatchJobItemOut(BaseModel):
    file_name: str
    success: bool
    drawing_id: Optional[int] = None
    error: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BatchJobOut(BaseModel):
    id: int
    building_id: int
    total_files: int
    completed_files: int
    failed_files: int
    status: str
    created_by: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: Optional[List[BatchJobItemOut]] = []

    model_config = ConfigDict(from_attributes=True)


class DrawingBase(BaseModel):
    building_id: int


class DrawingUploadResponse(BaseModel):
    id: int
    building_id: int
    file_name: str
    status: str
    elements_count: int
    processing_time: float = 0.0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BOQElementRef(BaseModel):
    id: int
    element_type: str
    classification_status: str
    source_layer_name: str
    quantity: float
    unit: str

    model_config = ConfigDict(from_attributes=True)


class DrawingOut(DrawingBase):
    id: int
    batch_job_id: Optional[int] = None
    file_name: str
    file_path: str
    file_size: int
    status: str
    elements_count: int
    classified_count: int
    unclassified_count: int
    processing_time: float = 0.0
    error_message: Optional[str]
    uploaded_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DrawingListOut(DrawingBase):
    id: int
    batch_job_id: Optional[int] = None
    file_name: str
    file_size: int
    status: str
    elements_count: int
    classified_count: int
    unclassified_count: int
    processing_time: float = 0.0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)