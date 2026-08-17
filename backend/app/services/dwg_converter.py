import glob
import logging
import os
import subprocess
import tempfile
import threading
from typing import Optional

logger = logging.getLogger(__name__)


def _default_oda_path() -> str:
    """Locate ODAFileConverter.exe across common install paths (versioned or not)."""
    candidates = [
        os.environ.get("ODA_CONVERTER_PATH"),
        r"C:\Program Files\ODA\ODAFileConverter\ODAFileConverter.exe",
        r"C:\Program Files (x86)\ODA\ODAFileConverter\ODAFileConverter.exe",
        r"C:\Program Files\ODA\TeighaFileConverter\TeighaFileConverter.exe",
    ]
    for pattern in (
        r"C:\Program Files\ODA\ODAFileConverter*\ODAFileConverter.exe",
        r"C:\Program Files (x86)\ODA\ODAFileConverter*\ODAFileConverter.exe",
        r"C:\Program Files\ODA\TeighaFileConverter*\TeighaFileConverter.exe",
    ):
        candidates.extend(sorted(glob.glob(pattern)))
    for candidate in candidates:
        if candidate and os.path.exists(candidate):
            return candidate
    return candidates[1] if candidates[1] else ""


ODA_CONVERTER_PATH = _default_oda_path()


def ensure_dxf(file_content: bytes, file_name: str) -> bytes:
    """Convert DWG to DXF if needed. Returns DXF content bytes."""
    ext = os.path.splitext(file_name)[1].lower()

    if ext == ".dxf":
        return file_content

    if ext == ".dwg":
        dxf_content = _convert_dwg_to_dxf(file_content)
        if dxf_content:
            return dxf_content
        # ج9: لا نُعيد محتوى DWG الخام كما لو كان DXF — كان هذا يسبب فشلًا مضللًا
        # ("not a DXF file") للمستخدم بدل إظهار السبب الحقيقي لفشل التحويل.
        raise ValueError(
            "تعذر تحويل ملف DWG إلى DXF. تأكد من سلامة الملف، أو ثبّت ODA File Converter على الخادم."
        )

    raise ValueError(f"Unsupported file type: {ext}")


def _convert_dwg_to_dxf(dwg_content: bytes) -> Optional[bytes]:
    """Convert DWG to DXF using ODA File Converter or fallback."""
    # Method 1: Try ODA File Converter
    dxf = _convert_via_oda(dwg_content)
    if dxf:
        return dxf

    # Method 2: Try ezdxf DWG support (experimental)
    dxf = _convert_via_ezdxf(dwg_content)
    if dxf:
        return dxf

    return None


_ODA_LOCK = threading.Lock()


def _convert_via_oda(dwg_content: bytes) -> Optional[bytes]:
    """Convert using ODA File Converter CLI."""
    if not os.path.exists(ODA_CONVERTER_PATH):
        logger.warning("ODA File Converter غير مثبت في: %s", ODA_CONVERTER_PATH)
        return None

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            input_dir = os.path.join(tmpdir, "input")
            output_dir = os.path.join(tmpdir, "output")
            os.makedirs(input_dir)
            os.makedirs(output_dir)

            dwg_path = os.path.join(input_dir, "input.dwg")
            with open(dwg_path, "wb") as f:
                f.write(dwg_content)

            # ج9: ODA File Converter لا يدعم التنفيذ المتزامن (قفل على ملفات
            # الإعدادات) — تشغيلان معًا يُفشلان التحويل. نُسلسل التنفيذ عالميًا.
            with _ODA_LOCK:
                result = subprocess.run(
                    [ODA_CONVERTER_PATH, input_dir, output_dir, "ACAD2018", "DXF", "0", "1"],
                    capture_output=True,
                    text=True,
                    timeout=300,
                )

            dxf_path = os.path.join(output_dir, "input.dxf")
            if os.path.exists(dxf_path):
                with open(dxf_path, "rb") as f:
                    return f.read()
            logger.warning(
                "ODA لم ينتج ملف DXF. returncode=%s stderr=%s",
                result.returncode, (result.stderr or "")[:300],
            )
    except Exception as e:
        logger.warning("فشل تحويل ODA: %s", e)

    return None


def _convert_via_ezdxf(dwg_content: bytes) -> Optional[bytes]:
    """Try reading DWG with ezdxf (limited support for older formats)."""
    import tempfile
    try:
        import ezdxf
        import io

        with tempfile.NamedTemporaryFile(suffix=".dwg", delete=False) as tmp:
            tmp.write(dwg_content)
            dwg_path = tmp.name
        try:
            doc = ezdxf.readfile(dwg_path)
        except Exception:
            return None
        finally:
            try:
                os.unlink(dwg_path)
            except Exception:
                pass

        buf = io.BytesIO()
        doc.saveas(buf)
        return buf.getvalue()
    except Exception:
        return None
