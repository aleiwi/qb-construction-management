"""Arabic text support for reportlab PDFs.

Idea ported from the legacy QuantumBuild project (arabic-reshaper + Amiri
font flow), adapted from client-side jsPDF to server-side reportlab.

Why: reportlab performs no complex-text shaping, so Arabic renders
disconnected and in logical (reversed-looking) order. Pipeline here:
arabic_reshaper → presentation forms, python-bidi get_display → visual
order. Font: Amiri (SIL OFL, extracted from the legacy project's
AmiriFont.js) bundled at app/assets/Amiri-Regular.ttf.
"""
import logging
import re
from pathlib import Path

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

import arabic_reshaper
from bidi.algorithm import get_display

logger = logging.getLogger(__name__)

ARABIC_FONT_NAME = "Amiri"
_AR_RE = re.compile(r"[\u0600-\u06FF]")
_registered = False


def register_arabic_font() -> str:
    """Register the bundled Amiri font once; return usable font name."""
    global _registered
    if _registered:
        return ARABIC_FONT_NAME
    font_path = Path(__file__).resolve().parent.parent / "assets" / "Amiri-Regular.ttf"
    try:
        pdfmetrics.registerFont(TTFont(ARABIC_FONT_NAME, str(font_path)))
        _registered = True
        return ARABIC_FONT_NAME
    except Exception:
        logger.warning("Amiri font missing (%s); Arabic PDF falls back to Helvetica", font_path)
        return "Helvetica"


def shape_ar(text) -> str:
    """Make Arabic render correctly in reportlab (shaped + visual order).

    Non-Arabic strings pass through untouched; None/empty → "".
    """
    if text is None:
        return ""
    s = str(text)
    if not s or not _AR_RE.search(s):
        return s
    try:
        return get_display(arabic_reshaper.reshape(s))
    except Exception:
        logger.exception("Arabic shaping failed; returning raw text")
        return s
