import os
import io
import logging
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.drawing import DrawingUploadResponse, DrawingOut, DrawingListOut, BatchJobOut, BatchJobItemOut
from app.schemas.response import APIResponse
from app.services.drawing_service import DrawingService
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/drawings", tags=["Drawings"])


@router.get("", response_model=APIResponse[List[DrawingListOut]])
async def list_drawings(
    building_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    drawing_service = DrawingService(db)
    if building_id:
        drawings = await drawing_service.get_by_building(building_id)
        items = [DrawingListOut.model_validate(d) for d in drawings]
    else:
        drawings = await drawing_service.get_all(skip=(page - 1) * page_size, limit=page_size)
        items = [DrawingListOut.model_validate(d) for d in drawings]
    return APIResponse.ok(data=items, message="تم جلب قائمة المخططات بنجاح")


@router.post("", response_model=APIResponse[DrawingUploadResponse])
async def upload_drawing(
    building_id: int = Query(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="اسم الملف مطلوب")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="الملف فارغ")

    drawing_service = DrawingService(db)
    try:
        drawing = await drawing_service.process_upload(building_id, file.filename, content, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return APIResponse.ok(data=DrawingUploadResponse.model_validate(drawing), message="تم رفع المخطط وبدء المعالجة")


@router.get("/{drawing_id}", response_model=APIResponse[DrawingOut])
async def get_drawing(
    drawing_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    drawing_service = DrawingService(db)
    drawing = await drawing_service.get_by_id(drawing_id)
    if not drawing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المخطط غير موجود")
    return APIResponse.ok(data=DrawingOut.model_validate(drawing), message="تم جلب بيانات المخطط بنجاح")


@router.post("/batch", response_model=APIResponse[BatchJobOut])
async def upload_drawings_batch(
    building_id: int = Query(...),
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="لم يتم اختيار أي ملفات")

    drawing_service = DrawingService(db)
    file_entries = []
    for f in files:
        if not f.filename:
            continue
        content = await f.read()
        if len(content) == 0:
            continue
        file_entries.append({"name": f.filename, "content": content})

    if not file_entries:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="جميع الملفات فارغة أو غير صالحة")

    try:
        batch = await drawing_service.process_batch(building_id, file_entries, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    items = []
    for fe in file_entries:
        items.append(BatchJobItemOut(
            file_name=fe["name"],
            success=True,
            drawing_id=None,
            error=None,
        ))

    return APIResponse.ok(
        data=BatchJobOut(
            id=batch.id,
            building_id=batch.building_id,
            total_files=batch.total_files,
            completed_files=batch.completed_files,
            failed_files=batch.failed_files,
            status=batch.status.value if hasattr(batch.status, 'value') else batch.status,
            created_by=batch.created_by,
            error_message=batch.error_message,
            created_at=batch.created_at,
            updated_at=batch.updated_at,
            items=items,
        ),
        message="تم رفع ومعالجة الملفات بنجاح",
    )


@router.get("/{drawing_id}/preview")
async def preview_drawing(
    drawing_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    drawing_service = DrawingService(db)
    drawing = await drawing_service.get_by_id(drawing_id)
    if not drawing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المخطط غير موجود")

    file_path = drawing.file_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ملف المخطط غير موجود على الخادم")

    svg_content = None
    try:
        import ezdxf
        from ezdxf.addons.drawing import RenderContext, Frontend
        from ezdxf.addons.drawing.svg import SVGBackend
        from ezdxf.addons.drawing import layout

        doc = ezdxf.readfile(file_path)
        backend = SVGBackend()
        context = RenderContext(doc)
        frontend = Frontend(context, backend)
        frontend.draw_layout(doc.modelspace())
        p = layout.Page(800, 600, margins=layout.Margins(5, 5, 5, 5))
        svg_content = backend.get_string(p)
        # Strip XML declaration for inline use
        svg_content = re.sub(r'<\?xml[^>]*\?>', '', svg_content).strip()
        # Make SVG responsive: replace fixed width/height with 100%
        svg_content = re.sub(r'\bwidth="[^"]*"', 'width="100%"', svg_content)
        svg_content = re.sub(r'\bheight="[^"]*"', 'height="100%"', svg_content)
    except Exception as exc:
        logger.warning("Failed to generate SVG preview for drawing %s: %s", drawing_id, exc)

    if not svg_content:
        return APIResponse.ok(data={"svg": None}, message="تعذر إنشاء معاينة للمخطط")

    return APIResponse.ok(data={"svg": svg_content}, message="تم إنشاء المعاينة بنجاح")





@router.get("/{drawing_id}/download")
async def download_drawing(
    drawing_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    drawing_service = DrawingService(db)
    drawing = await drawing_service.get_by_id(drawing_id)
    if not drawing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المخطط غير موجود")
    if not os.path.exists(drawing.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ملف المخطط غير موجود على الخادم")
    return FileResponse(drawing.file_path, filename=drawing.file_name, media_type="application/octet-stream")


@router.delete("/{drawing_id}", response_model=APIResponse)
async def delete_drawing(
    drawing_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    drawing_service = DrawingService(db)
    deleted = await drawing_service.delete(drawing_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المخطط غير موجود")
    return APIResponse.ok(message="تم حذف المخطط بنجاح")