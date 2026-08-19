"""Unit tests for the completion PDF builder (no Playwright needed — tests _build_html)."""
import pytest
from app.services.completion_pdf_service import _build_html


def _m32_data():
    """Minimal reference dataset mirroring the approved M32 report (cp.pdf)."""
    return {
        "companyName": "مسقا الأولى للتطوير العقاري",
        "projectName": "مشروع مسقا 32",
        "projectType": "شقق سكنية",
        "projectNumber": "M32",
        "location": "حي السعادة — الرياض",
        "unitsCount": 247,
        "reportPeriod": "يونيو 2026 (شهر 6)",
        "docRef": "PR-MSGA-32-2026-06",
        "contractDurationMonths": 18,
        "actualDurationMonths": 15,
        "contractorBudget": 49452000,
        "developerBudget": 7417500,
        "totalBudget": 56869500,
        "finishingSectors": [
            {"id": "s1", "name": "التأسيسات الكهروميكانيكية"},
            {"id": "s2", "name": "اللياسة والمعجون"},
            {"id": "s3", "name": "الجبس والجبس بورد"},
            {"id": "s4", "name": "الدهانات"},
            {"id": "s5", "name": "الأرضيات والرخام والبلاط"},
            {"id": "s6", "name": "الأبواب والألمنيوم"},
            {"id": "s7", "name": "الأعمال المعدنية"},
            {"id": "s8", "name": "العزل"},
        ],
        "structureItems": [{"id": f"st{i}", "name": f"بند عظم {i}", "progress": 100} for i in range(29)],
        "finishingItems": [
            {"id": "f1", "name": "تأسيس الكهرباء", "progress": 90, "sectorId": "s1"},
            {"id": "f2", "name": "تأسيس السباكة", "progress": 90, "sectorId": "s1"},
            {"id": "f3", "name": "اعمال الطرطشة الداخلية", "progress": 90, "sectorId": "s2"},
            {"id": "f4", "name": "تأسيس الدفاع المدني", "progress": 88, "sectorId": "s1"},
            {"id": "f5", "name": "اختبار التكييف", "progress": 90, "sectorId": "s1"},
            {"id": "f6", "name": "الأعمال المعدنية", "progress": 53, "sectorId": "s7"},
            {"id": "f7", "name": "بلاط جدران الحمامات", "progress": 0, "sectorId": "s5"},
            {"id": "f8", "name": "اللياسة الداخلية", "progress": 44, "sectorId": "s2"},
            {"id": "f9", "name": "الجبس", "progress": 62, "sectorId": "s3"},
            {"id": "f10", "name": "اعمال تأسيس المعجون", "progress": 50, "sectorId": "s2"},
            {"id": "f11", "name": "تركيب أبواب الشقق", "progress": 0, "sectorId": "s6"},
            {"id": "f12", "name": "اكسسوارات الأبواب", "progress": 0, "sectorId": "s6"},
            {"id": "f13", "name": "تمديدات التكييفات", "progress": 0, "sectorId": "s1"},
            {"id": "f14", "name": "اعمال الجبس بورد وجبس الحمامات", "progress": 60, "sectorId": "s3"},
            {"id": "f15", "name": "عزل الحمامات والمطابخ", "progress": 0, "sectorId": "s8"},
            {"id": "f16", "name": "بلاط الأرضيات والحمامات", "progress": 0, "sectorId": "s5"},
            {"id": "f17", "name": "رخام الممرات", "progress": 0, "sectorId": "s5"},
            {"id": "f18", "name": "ابواب الشقق (حديد)", "progress": 0, "sectorId": "s6"},
            {"id": "f19", "name": "ابواب الغرف والحمامات (WPC)", "progress": 0, "sectorId": "s6"},
            {"id": "f20", "name": "الدهانات (أوجه الدهان)", "progress": 42, "sectorId": "s4"},
            {"id": "f21", "name": "اللياسة الخارجية", "progress": 0, "sectorId": "s2"},
            {"id": "f22", "name": "الرشة الخارجية", "progress": 0, "sectorId": "s2"},
            {"id": "f23", "name": "الألمنيوم", "progress": 0, "sectorId": "s6"},
            {"id": "f24", "name": "حماية الشبابيك", "progress": 100, "sectorId": "s6"},
            {"id": "f25", "name": "اكسسوارات السباكة", "progress": 0, "sectorId": "s1"},
            {"id": "f26", "name": "اكسسوارات الكهرباء", "progress": 0, "sectorId": "s1"},
            {"id": "f27", "name": "بلاط الأسطح", "progress": 0, "sectorId": "s5"},
            {"id": "f28", "name": "البلاط ودورات الانترلوك", "progress": 0, "sectorId": "s5"},
            {"id": "f29", "name": "الأسفلت", "progress": 0, "sectorId": "s5"},
        ],
        "paymentsSchedule": [
            {"id": "p1", "name": "الدفعات المقدمة", "ratio": 15, "contractorVal": 7417500, "devVal": 1112625, "totalVal": 8530125, "paid": True, "dueDate": "7/2025"},
            {"id": "p2", "name": "البيارة والخزانات والأساسات", "ratio": 15, "contractorVal": 7417500, "devVal": 1112625, "totalVal": 8530125, "paid": True, "dueDate": "1/2026"},
            {"id": "p3", "name": "الكمرات الأرضية", "ratio": 10, "contractorVal": 4945000, "devVal": 741750, "totalVal": 5686750, "paid": True, "dueDate": "3/2026"},
            {"id": "p4", "name": "صب بلاطة الدور الأرضي", "ratio": 15, "contractorVal": 7417500, "devVal": 1112625, "totalVal": 8530125, "paid": True, "dueDate": "3/2026"},
            {"id": "p5", "name": "صب بلاطة الدور الأول", "ratio": 15, "contractorVal": 7417500, "devVal": 1112625, "totalVal": 8530125, "paid": True, "dueDate": "4/2026"},
            {"id": "p6", "name": "صب بلاطة الدور الثاني", "ratio": 10, "contractorVal": 4945000, "devVal": 741750, "totalVal": 5686750, "paid": False, "dueDate": "7/2026"},
            {"id": "p7", "name": "صب بلاطة الدور الثالث", "ratio": 10, "contractorVal": 4945000, "devVal": 741750, "totalVal": 5686750, "paid": False, "dueDate": "9/2026"},
            {"id": "p8", "name": "بعد التمديدات الكهربائية والبلاط واللياسة الخارجية", "ratio": 5, "contractorVal": 2473500, "devVal": 370875, "totalVal": 2844375, "paid": False, "dueDate": "11/2026"},
            {"id": "p9", "name": "الدفعة النهائية بعد التسليم", "ratio": 5, "contractorVal": 2473500, "devVal": 370875, "totalVal": 2844375, "paid": False, "dueDate": "12/2026"},
        ],
        "photoGallery": [],
    }


@pytest.fixture
def m32_html():
    return _build_html(_m32_data())


def test_builds_exactly_6_a4_pages(m32_html):
    assert m32_html.count('class="page"') == 5


def test_key_progress_values_match_cp_pdf(m32_html):
    # structure 100%, finishing 29.6%, overall 64.8% (displayed as 65% in cp.pdf)
    assert ">100.0%<" in m32_html
    assert ">29.6%<" in m32_html
    assert ">64.8%<" in m32_html


def test_payment_rows_use_name_ratio_due_date(m32_html):
    assert "الدفعات المقدمة" in m32_html
    assert "الدفعة النهائية بعد التسليم" in m32_html
    assert ">15%<" in m32_html
    assert "7/2025" in m32_html
    assert ">5%<" in m32_html


def test_financial_totals_match_cp_pdf(m32_html):
    assert "39,807,250" in m32_html  # paid total
    assert "17,062,250" in m32_html  # pending total
    assert "56,869,500" in m32_html  # total budget
    assert "70% مصروف" in m32_html  # spend ratio


def test_sector_item_counts_and_progress(m32_html):
    # الأسفلت belongs to s5 (الأرضيات) → 6 items; s7 has 1 item
    assert ">6 بنود<" in m32_html
    assert ">1 بنود<" in m32_html
    assert ">53%<" in m32_html  # s7 single item (rounded like cp.pdf)
    assert ">17%<" in m32_html  # s6 (6 items avg)


def test_project_metadata_rendered(m32_html):
    assert "247 وحدة سكنية" in m32_html
    assert "PR-MSGA-32-2026-06" in m32_html
    assert ">18 شهراً<" in m32_html
    assert ">15 شهراً<" in m32_html


def test_structure_item_names_rendered(m32_html):
    assert "بند عظم 28" in m32_html
    assert "بند عظم 0" in m32_html


def test_handles_empty_data_gracefully():
    html = _build_html({})
    assert html.count('class="page"') == 5
    assert "0.0%<" in html
