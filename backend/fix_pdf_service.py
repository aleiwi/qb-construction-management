import re
from pathlib import Path

target_file = Path(r"c:\Users\abood\Desktop\QB\backend\app\services\completion_pdf_service.py")
content = target_file.read_text(encoding="utf-8")

# Find the end of _build_html function (marked by </body>\n</html>""")
pattern = '</body>\n</html>"""'
pos = content.rfind(pattern)
if pos == -1:
    pattern = '</body>\r\n</html>"""'
    pos = content.rfind(pattern)

if pos != -1:
    cutoff = pos + len(pattern)
    base = content[:cutoff]

    pdf_code = """


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
"""
    target_file.write_text(base + pdf_code, encoding="utf-8")
    print("SUCCESS")
else:
    print("Pattern not found")
