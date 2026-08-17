import os
import uuid
import io
import time
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.drawing import Drawing, DrawingStatus
from app.models.boq_element import BOQElement, ClassificationStatus
from app.models.batch_job import BatchJob, BatchJobStatus
from app.services.boq_extraction_service import extract_elements_from_dxf
from app.services.dwg_converter import ensure_dxf, ODA_CONVERTER_PATH
from sqlalchemy import update


class DrawingService:
    UPLOAD_DIR = "uploads/drawings"
    ALLOWED_EXTENSIONS = {".dxf", ".dwg"}

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, drawing_id: int, with_elements: bool = False) -> Optional[Drawing]:
        stmt = select(Drawing).filter(Drawing.id == drawing_id)
        if with_elements:
            stmt = stmt.options(selectinload(Drawing.boq_elements))
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_building(self, building_id: int) -> List[Drawing]:
        result = await self.db.execute(
            select(Drawing)
            .filter(Drawing.building_id == building_id)
            .order_by(Drawing.created_at.desc())
        )
        return result.scalars().all()

    async def get_all(self, skip: int = 0, limit: int = 20) -> List[Drawing]:
        result = await self.db.execute(
            select(Drawing)
            .offset(skip)
            .limit(limit)
            .order_by(Drawing.created_at.desc())
        )
        return result.scalars().all()

    async def process_upload(
        self,
        building_id: int,
        file_name: str,
        file_content: bytes,
        user_id: int,
        batch_job_id: Optional[int] = None,
        defer_extraction: bool = False,
    ) -> Drawing:
        ext = os.path.splitext(file_name)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            raise ValueError(f"File type {ext} not allowed. Only .dxf and .dwg are supported.")
        # ج8: DWG يتطلب محول ODA File Converter — بدونها تفشل المعالجة وتظهر رسائل غامضة.
        if ext == ".dwg" and not os.path.exists(ODA_CONVERTER_PATH):
            raise ValueError(
                "صيغة DWG غير مدعومة لأن محول ODA File Converter غير مثبت على الخادم. "
                "ثبّته (https://www.opendesign.com) ثم أعد المحاولة، أو ارفع الملف بصيغة DXF."
            )

        stored_name = f"{uuid.uuid4()}{ext}"
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(self.UPLOAD_DIR, stored_name)

        with open(file_path, "wb") as f:
            f.write(file_content)

        drawing = Drawing(
            building_id=building_id,
            batch_job_id=batch_job_id,
            file_name=file_name,
            file_path=file_path,
            file_size=len(file_content),
            status=DrawingStatus.PENDING,
            uploaded_by=user_id,
        )
        self.db.add(drawing)
        await self.db.commit()
        await self.db.refresh(drawing)

        if not defer_extraction:
            try:
                await self._run_extraction(drawing)
            except Exception as e:
                drawing.status = DrawingStatus.FAILED
                drawing.error_message = str(e)
                await self.db.commit()

        return drawing

    async def process_batch(
        self,
        building_id: int,
        files: List[dict],
        user_id: int,
    ) -> BatchJob:
        batch = BatchJob(
            building_id=building_id,
            total_files=len(files),
            completed_files=0,
            failed_files=0,
            status=BatchJobStatus.PROCESSING,
            created_by=user_id,
        )
        self.db.add(batch)
        await self.db.commit()
        await self.db.refresh(batch)

        for file_entry in files:
            try:
                await self.process_upload(
                    building_id=building_id,
                    file_name=file_entry["name"],
                    file_content=file_entry["content"],
                    user_id=user_id,
                    batch_job_id=batch.id,
                )
                batch.completed_files += 1
            except Exception as e:
                batch.failed_files += 1
                # Could log per-file errors if needed

            await self.db.commit()

        if batch.failed_files == 0:
            batch.status = BatchJobStatus.COMPLETED
        elif batch.completed_files > 0:
            batch.status = BatchJobStatus.PARTIAL
        else:
            batch.status = BatchJobStatus.FAILED
        await self.db.commit()
        await self.db.refresh(batch)
        return batch

    async def _run_extraction(self, drawing: Drawing) -> None:
        start_time = time.time()
        drawing.status = DrawingStatus.PROCESSING
        await self.db.commit()

        # For DWG files, convert to DXF first and save to temp
        ext = os.path.splitext(drawing.file_name)[1].lower()

        # ج8: المعالجة الثقيلة (تحويل DWG + استخراج العناصر) تُنفَّذ في thread pool
        # حتى لا يُحجَب event loop عن بقية الطلبات أثناء معالجة الملفات الكبيرة.
        def _heavy_work() -> list:
            if ext == ".dwg":
                with open(drawing.file_path, "rb") as f:
                    content = f.read()
                dxf_content = ensure_dxf(content, drawing.file_name)
                import tempfile
                tmp = tempfile.NamedTemporaryFile(suffix=".dxf", delete=False)
                tmp.write(dxf_content)
                tmp.close()
                dxf_path = tmp.name
            else:
                dxf_path = drawing.file_path

            try:
                return extract_elements_from_dxf(dxf_path)
            finally:
                if ext == ".dwg":
                    try:
                        os.unlink(dxf_path)
                    except Exception:
                        pass

        import asyncio
        extracted = await asyncio.to_thread(_heavy_work)

        classified_count = 0
        unclassified_count = 0

        # ج8: الكتابة على دفعات (batch commit) لتقليل مدة قفل قاعدة البيانات
        # أثناء معالجة الملفات الضخمة حتى لا تعلق الطلبات الأخرى.
        BATCH_SIZE = 500
        for batch_start in range(0, len(extracted), BATCH_SIZE):
            for item in extracted[batch_start:batch_start + BATCH_SIZE]:
                element = BOQElement(
                    drawing_id=drawing.id,
                    element_type=item["element_type"],
                    classification_status=item["classification_status"],
                    source_layer_name=item["source_layer_name"],
                    quantity=item["quantity"],
                    unit=item["unit"],
                    dimensions_json=item.get("dimensions_json"),
                )
                self.db.add(element)

                if item["classification_status"] == ClassificationStatus.UNCLASSIFIED:
                    unclassified_count += 1
                else:
                    classified_count += 1
            await self.db.commit()

        drawing.elements_count = len(extracted)
        drawing.classified_count = classified_count
        drawing.unclassified_count = unclassified_count
        drawing.processing_time = round(time.time() - start_time, 2)
        drawing.status = DrawingStatus.COMPLETED
        await self.db.commit()

    async def delete(self, drawing_id: int) -> bool:
        drawing = await self.get_by_id(drawing_id)
        if not drawing:
            return False
        if os.path.exists(drawing.file_path):
            os.remove(drawing.file_path)
        await self.db.delete(drawing)
        await self.db.commit()
        return True
