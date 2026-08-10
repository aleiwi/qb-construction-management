import io
from datetime import datetime
from typing import Dict, Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


# Colors
DARK = HexColor("#1E293B")
EMERALD = HexColor("#059669")
SLATE = HexColor("#64748B")
LIGHT = HexColor("#F8FAFC")
BORDER_COLOR = HexColor("#CBD5E1")

# Try to register Arabic font; fallback to Helvetica
try:
    pdfmetrics.registerFont(TTFont("NotoNaskhArabic", "NotoNaskhArabic-Regular.ttf"))
    BASE_FONT = "NotoNaskhArabic"
except Exception:
    BASE_FONT = "Helvetica"


def _build_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        "CoverTitle", fontName=BASE_FONT, fontSize=24, textColor=DARK, spaceAfter=6,
        alignment=1,
    ))
    styles.add(ParagraphStyle(
        "CoverSub", fontName=BASE_FONT, fontSize=12, textColor=SLATE, spaceAfter=4,
        alignment=1,
    ))
    styles.add(ParagraphStyle(
        "SectionTitle", fontName=BASE_FONT, fontSize=14, textColor=EMERALD, spaceBefore=12, spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        "BodyTextRTL", fontName=BASE_FONT, fontSize=10, textColor=DARK, spaceAfter=4,
        alignment=2,  # right-align for Arabic
    ))
    styles.add(ParagraphStyle(
        "TableHeader", fontName=BASE_FONT, fontSize=9, textColor=white, spaceAfter=0,
        alignment=1,
    ))
    return styles


def export_boq_to_pdf(boq_data: Dict, project_name: str = "BOQ Report") -> bytes:
    styles = _build_styles()
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=2*cm, bottomMargin=2*cm,
        leftMargin=2*cm, rightMargin=2*cm,
    )

    elements = []

    # === Cover Page ===
    elements.append(Spacer(1, 100))
    elements.append(Paragraph("Bill of Quantities", styles["CoverTitle"]))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(project_name, styles["CoverSub"]))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"Date: {datetime.utcnow().strftime('%Y-%m-%d')}", styles["CoverSub"]))
    elements.append(Spacer(1, 30))

    summary = boq_data.get("summary", {})
    cover_data = [
        ["Total Elements", str(boq_data.get("elements_count", 0))],
        ["Classified", str(boq_data.get("classified_count", 0))],
        ["Unclassified", str(boq_data.get("unclassified_count", 0))],
        ["Drawings Processed", str(boq_data.get("drawings_count", 0))],
        ["", ""],
        ["Base Cost", f"{summary.get('total_base_cost', 0):,.2f} SAR"],
        ["Overhead (10%)", f"{summary.get('overhead', 0):,.2f} SAR"],
        ["Profit (15%)", f"{summary.get('profit', 0):,.2f} SAR"],
        ["Contingency (5%)", f"{summary.get('contingency', 0):,.2f} SAR"],
        ["VAT (15%)", f"{summary.get('vat', 0):,.2f} SAR"],
        ["TOTAL", f"{summary.get('total', 0):,.2f} SAR"],
    ]

    cover_table = Table(cover_data, colWidths=[200, 150])
    cover_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), BASE_FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (-1, -1), DARK),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, BORDER_COLOR),
        ("LINEBELOW", (0, -1), (-1, -1), 1, EMERALD),
        ("FONTNAME", (0, -1), (-1, -1), BASE_FONT),
        ("FONTSIZE", (0, -1), (-1, -1), 12),
        ("TEXTCOLOR", (0, -1), (-1, -1), EMERALD),
    ]))
    elements.append(cover_table)
    elements.append(PageBreak())

    # === Detailed BOQ ===
    elements.append(Paragraph("Detailed BOQ", styles["SectionTitle"]))
    elements.append(Spacer(1, 6))

    by_type = boq_data.get("by_type", {})
    table_data = [["#", "Type", "Unit", "Quantity", "Total (SAR)"]]

    idx = 1
    for et_key, et_data in by_type.items():
        if isinstance(et_data, dict):
            table_data.append([
                str(idx),
                et_key,
                et_data.get("unit", "م2"),
                f"{et_data.get('total_quantity', 0):,.2f}",
                f"{et_data.get('base_cost', 0):,.2f}",
            ])
            idx += 1

    boq_table = Table(table_data, colWidths=[30, 100, 60, 80, 100])
    boq_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), BASE_FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(boq_table)
    elements.append(Spacer(1, 20))

    # === Signatures ===
    elements.append(Spacer(1, 40))
    elements.append(Paragraph("_________________________", styles["BodyTextRTL"]))
    elements.append(Paragraph("Prepared By", styles["CoverSub"]))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("_________________________", styles["BodyTextRTL"]))
    elements.append(Paragraph("Approved By", styles["CoverSub"]))

    doc.build(elements)
    buf.seek(0)
    return buf.getvalue()
