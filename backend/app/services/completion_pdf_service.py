"""
Professional PDF Generator for Completion Reports
Uses Playwright (Headless Chromium) to render a standalone HTML page
and export it as a perfect A4 Landscape PDF.

The layout replicates the approved reference report (cp.pdf — مسقا 32):
  1. ملخص الإنجاز ومؤشرات المشروع
  2. الإنجاز حسب مرحلتي العمل والقطاعات
  3. تفاصيل أعمال العظم
  4. تفاصيل أعمال التشطيبات
  5. ميزانية المشروع وبيان الدفعات
  6+. التوثيق المصور لسير العمل (مقسم على صفحات حسب عدد الصور)
  الأخيرة: التوقيعات والاعتمادات الرسمية
"""

import re
from typing import Any, Dict, List, Optional

# ──────────────────────────────────────────────────────────────────────────────
# Colour helpers
# ──────────────────────────────────────────────────────────────────────────────
def _progress_color(value: float) -> str:
    if value >= 100:
        return "#10b981"
    if value >= 40:
        return "#f59e0b"
    if value > 0:
        return "#3b82f6"
    return "#94a3b8"


def _format_currency(val: Any) -> str:
    try:
        return f"{float(val or 0):,.0f} ر.س"
    except (TypeError, ValueError):
        return "0 ر.س"


# ──────────────────────────────────────────────────────────────────────────────
# Progress calculation (mirrors frontend defaultCompletionData.js)
# ──────────────────────────────────────────────────────────────────────────────
def _avg(items: List[dict]) -> float:
    if not items:
        return 0.0
    vals = [float(it.get("progress", 0) or 0) for it in items]
    return round(sum(vals) / len(vals), 1)


def _overall(structure_items: List[dict], finishing_items: List[dict]) -> float:
    st = _avg(structure_items)
    fn = _avg(finishing_items)
    return round(st * 0.5 + fn * 0.5, 1)


def _sector_progress(sector_id: Any, finishing_items: List[dict]) -> float:
    items = [it for it in finishing_items if it.get("sectorId") == sector_id]
    if not items:
        return 0.0
    vals = [float(it.get("progress", 0) or 0) for it in items]
    return round(sum(vals) / len(vals), 1)


# ──────────────────────────────────────────────────────────────────────────────
# HTML helpers
# ──────────────────────────────────────────────────────────────────────────────
def _esc(val: Any) -> str:
    if val is None:
        return ""
    s = str(val)
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def _donut_svg(overall: float) -> str:
    pct = max(0.0, min(100.0, overall))
    remaining = max(0.0, 100.0 - pct)
    color = _progress_color(pct)
    r = 75
    cx = 100
    cy = 100
    c = 2 * 3.14159265 * r
    dash = (pct / 100.0) * c
    gap = c - dash

    return f"""
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="position:relative;width:200px;height:200px;">
        <svg width="200" height="200" viewBox="0 0 200 200" style="transform:rotate(-90deg);">
          <circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#f1f5f9" stroke-width="18"/>
          <circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{color}" stroke-width="18"
            stroke-dasharray="{dash:.2f} {gap:.2f}" stroke-linecap="round"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
          <div style="font-size:34px;font-weight:900;color:#0f172a;font-family:monospace;line-height:1;">{pct:.1f}%</div>
          <div style="font-size:9px;font-weight:700;color:#64748b;margin-top:3px;">متوسط نسبة الإنجاز الكلي</div>
        </div>
      </div>
      <div style="display:flex;gap:14px;margin-top:8px;font-size:10px;font-weight:800;">
        <span style="color:#047857;">■ منجز: <span style="font-family:monospace;">{pct:.1f}%</span></span>
        <span style="color:#64748b;">■ متبقٍّ: <span style="font-family:monospace;">{remaining:.1f}%</span></span>
      </div>
    </div>"""


def _badge(num: int, color: str = "#f59e0b") -> str:
    return f"""
    <span style="width:20px;height:20px;border-radius:50%;background:{color};color:#fff;
      font-size:10px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;
      flex-shrink:0;font-family:sans-serif;">{num}</span>"""


def _header(d: dict, title: str, page_num: int, total: int = 6) -> str:
    pn = f"{page_num:02d}" if total > 9 else f"0{page_num}"
    pt = f"{total:02d}" if total > 9 else f"0{total}"
    return f"""
    <div style="border-bottom:2px solid #f59e0b;padding-bottom:7px;margin-bottom:10px;
      display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="width:24px;height:24px;border-radius:50%;background:#f59e0b;color:#fff;
          font-size:11px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;font-family:sans-serif;">{page_num}</span>
        <div>
          <div style="font-size:13px;font-weight:900;color:#0f172a;">{title}</div>
          <div style="font-size:9px;color:#64748b;">{_esc(d.get('companyName') or 'مسقا الأولى للتطوير العقاري')} · متابعة التنفيذ</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;font-size:9px;color:#64748b;direction:rtl;">
        <span>المستند: <strong dir="ltr" style="color:#0f172a;font-family:monospace;">{_esc(d.get('docRef'))}</strong></span>
        <span style="width:1px;height:12px;background:#cbd5e1;"></span>
        <span>التاريخ: <strong style="color:#0f172a;">{_esc(d.get('reportPeriod'))}</strong></span>
        <span style="width:1px;height:12px;background:#cbd5e1;"></span>
        <span>الصفحة: <strong dir="ltr" style="font-family:monospace;color:#d97706;">{pn} / {pt}</strong></span>
      </div>
    </div>"""


def _footer(d: dict, page_num: int, total: int = 6) -> str:
    pn = f"{page_num:02d}" if total > 9 else f"0{page_num}"
    pt = f"{total:02d}" if total > 9 else f"0{total}"
    return f"""
    <div style="border-top:1px solid #e2e8f0;padding-top:6px;margin-top:auto;
      display:flex;justify-content:space-between;font-size:9px;color:#94a3b8;">
      <span>{_esc(d.get('companyName') or 'مسقا الأولى للتطوير العقاري')} · تقرير متابعة تنفيذ</span>
      <span dir="ltr" style="font-family:monospace;color:#64748b;">{_esc(d.get('docRef'))}</span>
      <span dir="ltr" style="font-family:monospace;font-weight:700;color:#475569;">{pn} / {pt}</span>
    </div>"""


def _section_title(num: int, title: str) -> str:
    return f"""
    <div style="display:flex;align-items:center;gap:7px;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:7px;">
      {_badge(num)}
      <span style="font-size:12px;font-weight:900;color:#1e293b;">{title}</span>
    </div>"""


def _progress_bar(pct: float, color: Optional[str] = None, height: str = "8px") -> str:
    c = color or _progress_color(pct)
    return f"""
    <div style="background:#f1f5f9;border-radius:9999px;height:{height};overflow:hidden;">
      <div style="background:{c};width:{min(pct, 100):.1f}%;height:100%;border-radius:9999px;"></div>
    </div>"""


def _stat_card(label: str, value: str, color: str = "#0f172a", sub: str = "") -> str:
    sub_html = f'<div style="font-size:8px;color:#94a3b8;margin-top:3px;">{sub}</div>' if sub else ""
    return f"""
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:9px 11px;text-align:right;">
      <div style="font-size:9.5px;font-weight:700;color:#64748b;">{label}</div>
      <div style="font-size:17px;font-weight:900;color:{color};font-family:monospace;margin-top:3px;">{value}</div>
      {sub_html}
    </div>"""


def _page(d: dict, page_num: int, body: str, title: str, total: int = 6) -> str:
    return f"""
    <div class="page">
      {_header(d, title, page_num, total)}
      {body}
      {_footer(d, page_num, total)}
    </div>"""


def _build_html(d: Dict[str, Any]) -> str:
    structure_items = d.get("structureItems", [])
    finishing_items = d.get("finishingItems", [])
    finishing_sectors = d.get("finishingSectors", [])
    payments = d.get("paymentsSchedule", [])
    photo_gallery = d.get("photoGallery", [])
    budget = float(d.get("totalBudget") or 0)

    st_pct = _avg(structure_items)
    fn_pct = _avg(finishing_items)
    overall = _overall(structure_items, finishing_items)

    completed = sum(1 for i in structure_items + finishing_items if float(i.get("progress", 0)) >= 100)
    active = sum(1 for i in structure_items + finishing_items if 0 < float(i.get("progress", 0)) < 100)
    pending = sum(1 for i in structure_items + finishing_items if float(i.get("progress", 0)) == 0)
    total_items = len(structure_items) + len(finishing_items)

    paid_val = sum((p.get("totalVal") or (p.get("contractorVal", 0) + p.get("devVal", 0))) for p in payments if p.get("paid"))
    pending_val = sum((p.get("totalVal") or (p.get("contractorVal", 0) + p.get("devVal", 0))) for p in payments if not p.get("paid"))
    paid_count = sum(1 for p in payments if p.get("paid"))
    unpaid_count = len(payments) - paid_count
    paid_ratio = max(0, min(100, round(paid_val / budget * 100))) if budget else 0

    # ── Calculate dynamic page count ────────────────────────────────────────
    PHOTOS_PER_PAGE = 6
    photo_chunks = []
    if photo_gallery:
        for i in range(0, len(photo_gallery), PHOTOS_PER_PAGE):
            photo_chunks.append(photo_gallery[i:i + PHOTOS_PER_PAGE])

    total_photo_pages = len(photo_chunks)
    total_pages = 5 + total_photo_pages  # 5 standard pages + N photo pages (signatures section removed)

    # ── Page 1: Executive overview + project info ───────────────────────────
    kpi_cells = [
        ("مكتملة", completed, "#059669", "بنود بنسبة 100%"),
        ("قيد التنفيذ", active, "#d97706", "بنود جارية"),
        ("لم تبدأ", pending, "#64748b", "بنود قادمة"),
    ]
    kpi_html = "".join(
        f"""
        <div style="background:{'#ecfdf5' if i == 0 else '#fffbeb' if i == 1 else '#f1f5f9'};
          border-right:4px solid {color};border-radius:10px;padding:9px;text-align:center;">
          <div style="font-size:17px;font-weight:900;color:{color};font-family:monospace;line-height:1;">{val}</div>
          <div style="font-size:9.5px;font-weight:700;color:#0f172a;margin-top:3px;">{label}</div>
          <div style="font-size:8px;color:#64748b;">{sub}</div>
        </div>"""
        for i, (label, val, color, sub) in enumerate(kpi_cells)
    )

    meta_rows = "".join(
        f"""
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:6px 9px;
          display:flex;justify-content:space-between;align-items:center;">
          <span style="color:#64748b;font-weight:600;font-size:9.5px;">{k}</span>
          <span style="color:#0f172a;font-weight:800;font-size:10px;">{v}</span>
        </div>"""
        for k, v in [
            ("نوع المشروع", _esc(d.get("projectType"))),
            ("رقم المشروع", f'<span dir="ltr" style="font-family:monospace;">{_esc(d.get("projectNumber"))}</span>'),
            ("الموقع", _esc(d.get("location"))),
            ("عدد الوحدات", f'{_esc(d.get("unitsCount"))} وحدة سكنية'),
            ("فترة التقرير", _esc(d.get("reportPeriod"))),
            ("إجمالي البنود", f'{total_items} بنداً'),
        ]
    )

    main_photo_html = ""
    mp = d.get("mainPhoto")
    if mp:
        src = mp.get("src") if isinstance(mp, dict) else (mp if isinstance(mp, str) else "")
        caption = _esc(mp.get("caption") if isinstance(mp, dict) else "") or "الصورة الرئيسية للموقع"
        if src:
            main_photo_html = f"""
            <div style="flex:1;min-height:0;margin-top:8px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;
              background:#0f172a;position:relative;display:flex;">
              <img src="{src}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"/>
              <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top, rgba(2,6,23,0.95), rgba(2,6,23,0.2) 70%, transparent);
                padding:12px 16px;color:#fff;">
                <div style="font-size:13px;font-weight:900;color:#fbbf24;">{caption}</div>
                <div style="font-size:9.5px;color:#cbd5e1;margin-top:2px;">تصوير وتوثيق الموقع الميداني لمشروع {_esc(d.get('projectName'))}</div>
              </div>
            </div>"""

    page1 = _page(d, 1, f"""
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;flex:1;">
      <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;">
        {_section_title(1, 'نظرة عامة على الإنجاز')}
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
          {_donut_svg(overall)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;border-top:1px solid #e2e8f0;padding-top:10px;">
          {kpi_html}
        </div>
      </div>
      <div class="card" style="display:flex;flex-direction:column;">
        {_section_title(2, 'بيانات المشروع')}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          {meta_rows}
        </div>
        {main_photo_html}
      </div>
    </div>""", 'ملخص الإنجاز ومؤشرات المشروع', total_pages)

    # ── Page 2: Stages & sectors ────────────────────────────────────────────
    indicator_cards = "".join(
        f"""
        <div style="background:{bg};border:1px solid {border};border-radius:12px;padding:10px 12px;
          display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:9.5px;font-weight:800;color:{txt};">{label}</div>
            <div style="font-size:19px;font-weight:900;color:{color};font-family:monospace;margin-top:3px;">{pct:.1f}%</div>
            <div style="font-size:8px;color:{txt};margin-top:2px;opacity:0.75;">{sub}</div>
          </div>
          <div style="width:36px;height:36px;border-radius:50%;background:{bg_circle};border:1px solid {circle_border};
            display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:{circle_txt};font-family:monospace;">
            {pct:.0f}%
          </div>
        </div>"""
        for label, pct, sub, bg, border, txt, color, bg_circle, circle_border, circle_txt in [
            ("متوسط الإنجاز الكلي", overall, f"إجمالي {total_items} بنداً هندسياً", "#0f172a", "#334155", "#fbbf24", "#fbbf24", "rgba(245,158,11,0.15)", "rgba(245,158,11,0.4)", "#fbbf24"),
            ("أعمال العظم (الهيكل)", st_pct, f"{len(structure_items)} بنداً · {'منجزة بالكامل' if st_pct == 100 else 'قيد التنفيذ'}", "#ecfdf5", "#a7f3d0", "#065f46", "#059669", "#059669", "#10b981", "#ffffff"),
            ("أعمال التشطيبات", fn_pct, f"{len(finishing_items)} بنداً · قيد التنفيذ الجاري", "#fffbeb", "#fde68a", "#92400e", "#d97706", "#d97706", "#f59e0b", "#ffffff"),
        ]
    )

    sector_rows = ""
    for idx, s in enumerate(finishing_sectors, start=1):
        pct = _sector_progress(s.get("id"), finishing_items)
        items_c = sum(1 for it in finishing_items if it.get("sectorId") == s.get("id"))
        color = _progress_color(pct)
        sector_rows += f"""
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:6px 9px;
          display:flex;align-items:center;gap:9px;">
          <span style="width:22px;height:22px;border-radius:50%;background:#0f172a;color:#fff;
            font-size:10px;font-weight:700;font-family:monospace;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">{idx}</span>
          <div style="width:180px;text-align:right;font-weight:800;color:#1e293b;font-size:10.5px;white-space:nowrap;flex-shrink:0;">{_esc(s.get('name'))}</div>
          <div style="flex:1;">{_progress_bar(pct, None, '12px')}</div>
          <div style="font-size:9px;color:#64748b;width:52px;text-align:center;flex-shrink:0;">{items_c} بنود</div>
          <div style="background:{color if pct > 0 else '#f1f5f9'};color:{'#ffffff' if pct > 0 else '#64748b'};
            font-family:monospace;font-weight:900;font-size:10.5px;padding:3px 9px;border-radius:8px;width:46px;text-align:center;flex-shrink:0;">{pct:.0f}%</div>
        </div>"""

    page2 = _page(d, 2, f"""
    <div style="display:flex;flex-direction:column;gap:12px;flex:1;">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;">
        {indicator_cards}
      </div>
      <div class="card" style="flex:1;display:flex;flex-direction:column;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:6px;">
          {_section_title(3, f'المؤشر العام — العظم والتشطيبات ({len(finishing_sectors)} قطاعات فرعية)')}
          <span style="font-size:9px;color:#64748b;">متابعة نسب إنجاز القطاعات الثمانية</span>
        </div>
        <div style="display:flex;flex-direction:column;justify-content:space-around;flex:1;gap:4px;">
          {sector_rows}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:6px;font-size:9px;">
          <div style="display:flex;gap:14px;font-weight:700;color:#334155;">
            <span>■ <span style="color:#059669;">مكتمل (100%)</span></span>
            <span>■ <span style="color:#d97706;">قيد التنفيذ (1%-99%)</span></span>
            <span>■ <span style="color:#94a3b8;">لم يبدأ (0%)</span></span>
          </div>
          <div style="font-family:monospace;font-weight:700;color:#64748b;">
            التشطيبات: <span style="color:#d97706;font-weight:900;">{fn_pct:.1f}%</span> · العظم: <span style="color:#059669;font-weight:900;">{st_pct:.1f}%</span> · الكلي: <span style="color:#0f172a;font-weight:900;">{overall:.1f}%</span>
          </div>
        </div>
      </div>
    </div>""", 'الإنجاز حسب مرحلتي العمل والقطاعات', total_pages)

    # ── Pages 3 & 4: detailed item tables ───────────────────────────────────
    def item_table(items: List[dict], start: int = 1) -> str:
        rows = ""
        for num, it in enumerate(items, start=start):
            pct = float(it.get("progress", 0) or 0)
            color = _progress_color(pct)
            rows += f"""
            <tr style="border-top:1px solid #f1f5f9;">
              <td style="padding:3.5px 6px;border-left:1px solid #e2e8f0;text-align:center;color:#64748b;font-family:monospace;font-weight:700;font-size:9px;width:24px;">{num}</td>
              <td style="padding:3.5px 6px;border-left:1px solid #e2e8f0;text-align:right;color:#1e293b;font-weight:800;font-size:9.5px;">{_esc(it.get('name'))}</td>
              <td style="padding:3.5px 6px;text-align:center;">
                <span style="display:inline-block;min-width:52px;background:{color + '1a' if pct > 0 else '#f1f5f9'};
                  color:{color if pct > 0 else '#64748b'};border:1px solid {color if pct > 0 else '#cbd5e1'};
                  border-radius:9999px;font-size:9px;font-weight:800;font-family:monospace;padding:2px 8px;">{pct:.0f}%</span>
              </td>
            </tr>"""
        return rows

    st_half = len(structure_items) // 2 + len(structure_items) % 2
    fn_half = len(finishing_items) // 2 + len(finishing_items) % 2

    def two_col_table(items: List[dict], half: int) -> str:
        col1 = item_table(items[:half], start=1)
        col2 = item_table(items[half:], start=half + 1)
        header = """
        <thead><tr style="background:#f1f5f9;color:#334155;">
          <th style="padding:4px 6px;border-left:1px solid #e2e8f0;text-align:center;width:24px;font-size:9px;">م</th>
          <th style="padding:4px 6px;border-left:1px solid #e2e8f0;text-align:right;font-size:9px;">البند</th>
          <th style="padding:4px 6px;text-align:center;font-size:9px;width:74px;">نسبة الإنجاز</th>
        </tr></thead>"""
        return f"""
        <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#fff;">
          <table style="width:100%;border-collapse:collapse;">
            {header}
            <tbody>{col1}</tbody>
          </table>
        </div>
        <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#fff;">
          <table style="width:100%;border-collapse:collapse;">
            {header}
            <tbody>{col2}</tbody>
          </table>
        </div>"""

    page3 = _page(d, 3, f"""
    <div style="display:flex;flex-direction:column;flex:1;">
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:8px 10px;
        display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:7px;">
          {_badge(4, '#059669')}
          <span style="font-size:11px;font-weight:900;color:#064e3b;">بنود أعمال العظم — متوسط الإنجاز {st_pct:.1f}%</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;font-size:9px;">
          <span style="background:#059669;color:#fff;border-radius:9999px;padding:2px 9px;font-weight:800;font-size:8.5px;">
            {'مكتمل (100%)' if st_pct == 100 else f'قيد التنفيذ ({st_pct:.0f}%)'}
          </span>
          <span style="color:#64748b;font-weight:600;">{len(structure_items)} بنداً — {'منجزة بالكامل' if st_pct == 100 else 'متابعة نسب الإنجاز الجارية'}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;flex:1;">
        {two_col_table(structure_items, st_half)}
      </div>
    </div>""", 'تفاصيل أعمال العظم (الهيكل والأساسات)', total_pages)

    page4 = _page(d, 4, f"""
    <div style="display:flex;flex-direction:column;flex:1;">
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:8px 10px;
        display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:7px;">
          {_badge(5)}
          <span style="font-size:11px;font-weight:900;color:#78350f;">بنود أعمال التشطيبات ({len(finishing_items)} بنداً هندسياً)</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;font-size:9px;">
          <span style="background:#f59e0b;color:#fff;border-radius:9999px;padding:2px 9px;font-weight:800;font-size:8.5px;">متوسط الإنجاز: {fn_pct:.1f}%</span>
          <span style="color:#64748b;font-weight:600;">متابعة دقيقة لنسب إنجاز بنود التشطيب الجارية</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;flex:1;">
        {two_col_table(finishing_items, fn_half)}
      </div>
      <div style="background:#0f172a;border-radius:10px;padding:9px 12px;margin-top:10px;
        display:flex;justify-content:space-between;align-items:center;font-size:11px;">
        <span style="font-weight:800;color:#fbbf24;">متوسط نسبة الإنجاز الكلي للمشروع</span>
        <div style="display:flex;gap:18px;font-family:monospace;font-weight:900;">
          <span style="color:#cbd5e1;">العظم: <span style="color:#34d399;">{st_pct:.1f}%</span></span>
          <span style="color:#cbd5e1;">التشطيبات: <span style="color:#fbbf24;">{fn_pct:.1f}%</span></span>
          <span style="background:#f59e0b;color:#0f172a;padding:2px 9px;border-radius:6px;">{overall:.1f}%</span>
        </div>
      </div>
    </div>""", 'تفاصيل أعمال التشطيبات', total_pages)

    # ── Page 5: Budget & payments ───────────────────────────────────────────
    budget_cards = "".join(
        f"""
        <div style="background:{bg};border:1px solid {border};border-radius:12px;padding:10px 12px;text-align:right;">
          <div style="font-size:9.5px;font-weight:800;color:{txt};">{label}</div>
          <div style="font-size:16px;font-weight:900;color:{color};font-family:monospace;margin-top:3px;">{value}</div>
          <div style="font-size:8px;color:{txt};margin-top:3px;opacity:0.75;">{sub}</div>
        </div>"""
        for label, value, sub, bg, border, txt, color in [
            ("إجمالي قيمة المشروع", _format_currency(budget),
             f"للمقاولات {_format_currency(d.get('contractorBudget'))} · للتطوير {_format_currency(d.get('developerBudget'))}",
             "#fff", "#e2e8f0", "#64748b", "#0f172a"),
            ("إجمالي ما تم صرفه", _format_currency(paid_val),
             f"{paid_count} دفعات مدفوعة · {paid_ratio}% من القيمة الكلية",
             "#ecfdf5", "#a7f3d0", "#065f46", "#059669"),
            ("إجمالي المتبقي", _format_currency(pending_val),
             f"{unpaid_count} دفعات قادمة · {100 - paid_ratio}% من القيمة الكلية",
             "#fffbeb", "#fde68a", "#92400e", "#d97706"),
        ]
    )

    payment_rows = ""
    for idx, p in enumerate(payments, start=1):
        val = p.get("totalVal") or (p.get("contractorVal", 0) + p.get("devVal", 0))
        paid = p.get("paid", False)
        status_html = f"""
        <span style="display:inline-flex;align-items:center;gap:4px;background:{'#d1fae5' if paid else '#fef3c7'};
          color:{'#047857' if paid else '#92400e'};border:1px solid {'#6ee7b7' if paid else '#fde68a'};
          border-radius:9999px;padding:2px 8px;font-size:8px;font-weight:800;">
          <span style="width:5px;height:5px;border-radius:50%;background:{'#059669' if paid else '#d97706'};"></span>
          {'مدفوع' if paid else 'غير مدفوع'}
        </span>"""
        payment_rows += f"""
        <tr style="border-top:1px solid #f1f5f9;">
          <td style="padding:3.5px 6px;border-left:1px solid #e2e8f0;text-align:center;color:#64748b;font-family:monospace;font-weight:700;font-size:8.5px;">{idx}</td>
          <td style="padding:3.5px 6px;border-left:1px solid #e2e8f0;text-align:right;color:#1e293b;font-weight:800;font-size:9px;">{_esc(p.get('name'))}</td>
          <td style="padding:3.5px 6px;border-left:1px solid #e2e8f0;text-align:center;font-family:monospace;font-weight:800;color:#d97706;font-size:9px;">{p.get('ratio', '')}%</td>
          <td style="padding:3.5px 6px;border-left:1px solid #e2e8f0;text-align:center;font-family:monospace;color:#334155;font-size:9px;">{_format_currency(p.get('contractorVal'))}</td>
          <td style="padding:3.5px 6px;border-left:1px solid #e2e8f0;text-align:center;font-family:monospace;color:#334155;font-size:9px;">{_format_currency(p.get('devVal'))}</td>
          <td style="padding:3.5px 6px;border-left:1px solid #e2e8f0;text-align:center;font-family:monospace;font-weight:900;color:#0f172a;font-size:9px;">{_format_currency(val)}</td>
          <td style="padding:3.5px 6px;border-left:1px solid #e2e8f0;text-align:center;">{status_html}</td>
          <td style="padding:3.5px 6px;text-align:center;font-family:monospace;font-weight:800;color:#475569;font-size:9px;">{_esc(p.get('dueDate'))}</td>
        </tr>"""

    page5 = _page(d, 5, f"""
    <div style="display:flex;flex-direction:column;gap:10px;flex:1;">
      <div class="card">
        {_section_title(6, 'ملخص الميزانية ومسار الصرف')}
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;margin-bottom:8px;">
          {budget_cards}
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:9px 11px;display:flex;align-items:center;gap:10px;">
          <div style="flex:1;display:flex;border-radius:9999px;overflow:hidden;height:18px;">
            <div style="background:#10b981;color:#fff;display:flex;align-items:center;justify-content:center;font-size:8.5px;font-weight:900;font-family:monospace;width:{paid_ratio}%;">
              {f'{paid_ratio}% مصروف' if paid_ratio >= 10 else ''}
            </div>
            <div style="background:#f59e0b;color:#0f172a;display:flex;align-items:center;justify-content:center;font-size:8.5px;font-weight:900;font-family:monospace;width:{100 - paid_ratio}%;">
              {f'{100 - paid_ratio}% متبقٍّ' if 100 - paid_ratio >= 10 else ''}
            </div>
          </div>
          <div style="font-size:9px;font-weight:800;color:#334155;white-space:nowrap;">
            مدة العقد <span style="font-family:monospace;color:#0f172a;">{_esc(d.get('contractDurationMonths'))} شهراً</span> ·
            مدة التنفيذ الفعلية <span style="font-family:monospace;color:#0f172a;">{_esc(d.get('actualDurationMonths'))} شهراً</span>
          </div>
        </div>
      </div>
      <div class="card" style="flex:1;display:flex;flex-direction:column;">
        {_section_title(7, f'بيان الدفعات حسب مراحل التنفيذ ({len(payments)} مراحل)')}
        <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#fff;flex:1;">
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#f1f5f9;color:#334155;">
              <th style="padding:4px 6px;border-left:1px solid #e2e8f0;text-align:center;width:20px;font-size:8.5px;">م</th>
              <th style="padding:4px 6px;border-left:1px solid #e2e8f0;text-align:right;font-size:8.5px;">المرحلة / الوصف</th>
              <th style="padding:4px 6px;border-left:1px solid #e2e8f0;text-align:center;font-size:8.5px;width:44px;">النسبة</th>
              <th style="padding:4px 6px;border-left:1px solid #e2e8f0;text-align:center;font-size:8.5px;">القيمة للمقاولات (ر.س)</th>
              <th style="padding:4px 6px;border-left:1px solid #e2e8f0;text-align:center;font-size:8.5px;">القيمة للتطوير (ر.س)</th>
              <th style="padding:4px 6px;border-left:1px solid #e2e8f0;text-align:center;font-size:8.5px;">إجمالي الدفعة (ر.س)</th>
              <th style="padding:4px 6px;border-left:1px solid #e2e8f0;text-align:center;font-size:8.5px;width:64px;">حالة الصرف</th>
              <th style="padding:4px 6px;text-align:center;font-size:8.5px;width:56px;">تاريخ الاستحقاق</th>
            </tr></thead>
            <tbody>{payment_rows}</tbody>
            <tfoot><tr style="background:#f1f5f9;font-weight:900;color:#0f172a;border-top:2px solid #cbd5e1;">
              <td colspan="2" style="padding:4px 6px;border-left:1px solid #e2e8f0;text-align:right;font-size:9px;">الإجمالي الكلي</td>
              <td style="padding:4px 6px;border-left:1px solid #e2e8f0;text-align:center;font-family:monospace;color:#d97706;font-size:9px;">100%</td>
              <td style="padding:4px 6px;border-left:1px solid #e2e8f0;text-align:center;font-family:monospace;font-size:9px;">{_format_currency(d.get('contractorBudget'))}</td>
              <td style="padding:4px 6px;border-left:1px solid #e2e8f0;text-align:center;font-family:monospace;font-size:9px;">{_format_currency(d.get('developerBudget'))}</td>
              <td style="padding:4px 6px;border-left:1px solid #e2e8f0;text-align:center;font-family:monospace;color:#059669;font-size:9px;">{_format_currency(budget)}</td>
              <td colspan="2" style="padding:4px 6px;text-align:center;font-size:8px;color:#64748b;font-weight:600;">شامل جميع المراحل والدفعات المستحقة</td>
            </tr></tfoot>
          </table>
        </div>
      </div>
    </div>""", 'ميزانية المشروع وبيان الدفعات', total_pages)

    # ── Pages 6+: Photos (paginated into chunks of 6) ───────────────────────
    photo_page_htmls = []
    for chunk_idx, chunk in enumerate(photo_chunks):
        page_number = 6 + chunk_idx
        photo_cells = ""
        for p in chunk:
            src = p.get('src', '')
            caption = _esc(p.get('caption') or p.get('title') or '')
            caption_html = f"""
            <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top, rgba(2,6,23,0.92), rgba(2,6,23,0.4) 60%, transparent);
              padding:6px 8px;color:#fff;font-size:9px;font-weight:800;text-align:right;">{caption}</div>""" if caption else ""
            photo_cells += f"""
            <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#0f172a;position:relative;height:245px;">
              <img src="{src}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"/>
              {caption_html}
            </div>"""

        subtitle = f' (صفحة {chunk_idx + 1} من {total_photo_pages})' if total_photo_pages > 1 else ''
        photo_page_body = f"""
        <div style="display:flex;flex-direction:column;gap:10px;flex:1;">
          <div class="card" style="flex:1;display:flex;flex-direction:column;">
            {_section_title(8, f'توثيق مصور لسير العمل الميداني{subtitle}')}
            <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:9px;flex:1;align-content:start;">
              {photo_cells}
            </div>
          </div>
        </div>"""
        photo_page_htmls.append(
            _page(d, page_number, photo_page_body, 'التوثيق المصور للموقع', total_pages)
        )

    all_photo_pages = "\n".join(photo_page_htmls)

    # ── CSS ──────────────────────────────────────────────────────────────────
    css = """
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      font-family: 'Tajawal', Arial, sans-serif;
      direction: rtl;
      background: white;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 297mm;
      height: 210mm;
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      padding: 8mm 12mm;
      background: white;
      overflow: hidden;
    }

    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 11px 13px;
    }

    @media print {
      @page { size: A4 landscape; margin: 0; }
    }
    """

    return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>تقرير نسب الإنجاز</title>
<style>{css}</style>
</head>
<body>
{page1}
{page2}
{page3}
{page4}
{page5}
{all_photo_pages}
</body>
</html>"""


# ──────────────────────────────────────────────────────────────────────────────
# PDF generation using Playwright (Sync API in worker thread for Windows & Linux)
# ──────────────────────────────────────────────────────────────────────────────
def _render_pdf_sync(html_content: str) -> bytes:
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1123, "height": 794})
        page.set_content(html_content, wait_until="networkidle")
        page.wait_for_timeout(1000)
        pdf_bytes = page.pdf(
            format="A4",
            landscape=True,
            print_background=True,
            margin={"top": "0", "bottom": "0", "left": "0", "right": "0"},
        )
        browser.close()

    return pdf_bytes


async def generate_completion_pdf(report_data: Dict[str, Any]) -> bytes:
    import asyncio
    html_content = _build_html(report_data)
    return await asyncio.to_thread(_render_pdf_sync, html_content)
