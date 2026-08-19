import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("qb.email")


def send_email(to_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> bool:
    """Send an HTML email via SMTP.

    When SMTP is not configured (SMTP_HOST empty), the email is written to the
    application log so dev/test flows remain testable end-to-end.
    """
    if not settings.SMTP_HOST:
        logger.info(
            "[EMAIL-DEV] to=%s subject=%s\n%s",
            to_email,
            subject,
            text_body or html_body,
        )
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(text_body or html_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, [to_email], msg.as_string())
        logger.info("email sent to=%s subject=%s", to_email, subject)
        return True
    except Exception:
        logger.exception("failed to send email to=%s subject=%s", to_email, subject)
        return False


def _link(url: str) -> str:
    base = settings.FRONTEND_URL.rstrip("/")
    return f"{base}{url}"


def send_activation_email(to_email: str, full_name: str, token: str) -> bool:
    url = _link(f"/verify-email?token={token}")
    html = f"""
    <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:520px;margin:auto;">
      <h2 style="color:#0f172a;">تفعيل حسابك في نظام إدارة المقاولات</h2>
      <p>مرحباً {full_name}،</p>
      <p>تم إنشاء حسابك. لتفعيله وتحديد كلمة المرور الخاصة بك، اضغط على الرابط التالي:</p>
      <p><a href="{url}" style="background:#2563eb;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;display:inline-block;">تفعيل الحساب</a></p>
      <p style="color:#64748b;font-size:12px;">الرابط صالح لمدة 24 ساعة. إذا لم تطلب هذا، تجاهل هذه الرسالة.</p>
    </div>
    """
    return send_email(to_email, "تفعيل حسابك في نظام إدارة المقاولات", html)


def send_password_reset_email(to_email: str, full_name: str, token: str) -> bool:
    url = _link(f"/reset-password?token={token}")
    html = f"""
    <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:520px;margin:auto;">
      <h2 style="color:#0f172a;">إعادة تعيين كلمة المرور</h2>
      <p>مرحباً {full_name}،</p>
      <p>لقد طلبت إعادة تعيين كلمة المرور. اضغط على الرابط التالي لاختيار كلمة مرور جديدة:</p>
      <p><a href="{url}" style="background:#2563eb;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;display:inline-block;">إعادة تعيين كلمة المرور</a></p>
      <p style="color:#64748b;font-size:12px;">الرابط صالح لمدة 30 دقيقة فقط. إذا لم تطلب هذا، تجاهل هذه الرسالة.</p>
    </div>
    """
    return send_email(to_email, "إعادة تعيين كلمة المرور — نظام إدارة المقاولات", html)