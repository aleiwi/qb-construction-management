"""M1 merge (legacy QuantumBuild idea): Arabic shaping for reportlab PDFs."""
import pytest


def test_amiri_font_registers():
    from app.services.arabic_pdf import register_arabic_font
    assert register_arabic_font() == "Amiri"


def test_shape_ar_shapes_rtl_and_passes_latin():
    from app.services.arabic_pdf import shape_ar
    shaped = shape_ar("مشروع الأمواج")
    assert shaped and shaped != "مشروع الأمواج"  # presentation forms applied
    assert shape_ar("BOQ 123") == "BOQ 123"
    assert shape_ar(None) == ""
    assert shape_ar("") == ""


def test_boq_pdf_exports_valid_bytes_with_arabic():
    from app.services.pdf_exporter import export_boq_to_pdf
    data = {
        "elements_count": 2,
        "classified_count": 1,
        "unclassified_count": 1,
        "drawings_count": 1,
        "summary": {
            "total_base_cost": 100.0, "overhead": 10.0, "profit": 15.0,
            "contingency": 5.0, "vat": 19.5, "total": 149.5,
        },
        "by_type": {
            "wall": {"count": 1, "total_quantity": 5.0, "unit": "م3", "base_cost": 100.0},
        },
    }
    pdf = export_boq_to_pdf(data, "مشروع الأمواج السكني")
    assert pdf[:4] == b"%PDF"
    assert len(pdf) > 1000
