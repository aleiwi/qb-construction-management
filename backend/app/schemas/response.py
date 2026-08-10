from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class ErrorDetail(BaseModel):
    code: str
    message: str

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = "تم بنجاح"
    error: Optional[ErrorDetail] = None

    @classmethod
    def ok(cls, data: Any = None, message: str = "تم بنجاح"):
        return cls(success=True, data=data, message=message, error=None)

    @classmethod
    def fail(cls, code: str, message: str):
        return cls(success=False, data=None, message=None, error=ErrorDetail(code=code, message=message))
