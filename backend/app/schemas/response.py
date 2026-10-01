from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class ErrorDetail(BaseModel):
    code: str
    message: str

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    meta: Optional[dict] = None
    message: Optional[str] = "تم بنجاح"
    error: Optional[ErrorDetail] = None

    @classmethod
    def ok(cls, data: Any = None, message: str = "تم بنجاح", meta: Optional[dict] = None):
        return cls(success=True, data=data, meta=meta, message=message, error=None)

    @classmethod
    def fail(cls, code: str, message: str):
        return cls(success=False, data=None, message=None, error=ErrorDetail(code=code, message=message))
