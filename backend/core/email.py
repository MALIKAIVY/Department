import logging
from html import escape
from pathlib import Path
from typing import List, Optional

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from core.config import settings

logger = logging.getLogger(__name__)
EMAIL_LOG_PATH = Path(__file__).resolve().parents[1] / "email_debug.log"


def write_email_debug(message: str) -> None:
    try:
        with EMAIL_LOG_PATH.open("a", encoding="utf-8") as log_file:
            log_file.write(message + "\n")
    except Exception:
        logger.debug("Could not write email debug log", exc_info=True)

def get_mail_config() -> ConnectionConfig:
    return ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME,
        MAIL_PASSWORD=settings.MAIL_PASSWORD,
        MAIL_FROM=settings.MAIL_FROM,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER,
        MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
        MAIL_STARTTLS=settings.MAIL_STARTTLS,
        MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
        USE_CREDENTIALS=settings.USE_CREDENTIALS,
        VALIDATE_CERTS=settings.VALIDATE_CERTS,
    )


def is_email_configured() -> bool:
    return bool(
        settings.MAIL_ENABLED
        and settings.MAIL_SERVER
        and settings.MAIL_FROM
        and (not settings.USE_CREDENTIALS or (settings.MAIL_USERNAME and settings.MAIL_PASSWORD))
    )


def email_diagnostics() -> dict:
    return {
        "mail_enabled": settings.MAIL_ENABLED,
        "configured": is_email_configured(),
        "mail_server": settings.MAIL_SERVER,
        "mail_port": settings.MAIL_PORT,
        "mail_username_set": bool(settings.MAIL_USERNAME),
        "mail_password_set": bool(settings.MAIL_PASSWORD),
        "mail_from": settings.MAIL_FROM,
        "mail_from_name": settings.MAIL_FROM_NAME,
        "mail_starttls": settings.MAIL_STARTTLS,
        "mail_ssl_tls": settings.MAIL_SSL_TLS,
        "use_credentials": settings.USE_CREDENTIALS,
        "frontend_url": settings.FRONTEND_URL,
    }


async def send_user_creation_email(email: str, full_name: str, password: str, role: str) -> bool:
    """
    Send a welcome email to a newly created member.
    If SMTP is incomplete, log the email content so local development still works.
    """
    login_url = f"{settings.FRONTEND_URL.rstrip('/')}/login"
    safe_email = escape(email)
    safe_name = escape(full_name)
    safe_password = escape(password)
    safe_role = escape(role.capitalize())

    subject = f"Welcome to DTCY, {full_name}!"
    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #2563eb;">Welcome to DTCY!</h2>
          <p>Hello <strong>{safe_name}</strong>,</p>
          <p>An account has been created for you on the Digital Tech-Connect Yearbook platform.</p>

          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Login Credentials:</strong></p>
            <p style="margin: 5px 0;">Email: {safe_email}</p>
            <p style="margin: 5px 0;">Password: <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 4px;">{safe_password}</code></p>
            <p style="margin: 5px 0;">Role: {safe_role}</p>
          </div>

          <p>You will be prompted to complete onboarding and change your password on first login.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{login_url}"
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Login to Your Account
            </a>
          </div>

          <p style="font-size: 0.8em; color: #666;">
            If you did not expect this email, please ignore it or contact the administrator.
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8em; color: #999; text-align: center;">
            Digital Tech-Connect Yearbook
          </p>
        </div>
      </body>
    </html>
    """

    message = MessageSchema(
        subject=subject,
        recipients=[email],
        body=body,
        subtype=MessageType.html,
    )

    try:
        if not is_email_configured():
            logger.warning("SMTP settings are not fully configured. Logging welcome email instead.")
            logger.info("-" * 50)
            logger.info("WELCOME EMAIL SIMULATION (SMTP NOT CONFIGURED)")
            logger.info("TO: %s", email)
            logger.info("LOGIN URL: %s", login_url)
            logger.info("ROLE: %s", role)
            logger.info("TEMPORARY PASSWORD: %s", password)
            logger.info("-" * 50)
            return True

        await FastMail(get_mail_config()).send_message(message)
        logger.info("Successfully sent welcome email to %s", email)
        write_email_debug(f"SUCCESS welcome email to {email}")
        return True
    except Exception as exc:
        logger.error("Failed to send welcome email to %s: %s", email, exc)
        write_email_debug(f"FAILED welcome email to {email}: {exc}")
        return False


async def send_test_email(recipient: str) -> dict:
    if not is_email_configured():
        return {
            "sent": False,
            "error": "SMTP settings are not fully configured.",
            "diagnostics": email_diagnostics(),
        }

    message = MessageSchema(
        subject="DTCY SMTP Test",
        recipients=[recipient],
        body="""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #2563eb;">DTCY email test</h2>
            <p>If you received this message, SMTP is configured correctly.</p>
          </body>
        </html>
        """,
        subtype=MessageType.html,
    )

    try:
        await FastMail(get_mail_config()).send_message(message)
        logger.info("Successfully sent SMTP test email to %s", recipient)
        write_email_debug(f"SUCCESS test email to {recipient}")
        return {"sent": True, "recipient": recipient, "diagnostics": email_diagnostics()}
    except Exception as exc:
        logger.error("SMTP test email failed for %s: %s", recipient, exc)
        write_email_debug(f"FAILED test email to {recipient}: {exc}")
        return {
            "sent": False,
            "recipient": recipient,
            "error": str(exc),
            "diagnostics": email_diagnostics(),
        }


async def send_bulk_creation_emails(users: List[dict]) -> None:
    for user in users:
        await send_user_creation_email(
            email=user["email"],
            full_name=user["full_name"],
            password=user["password"],
            role=user["role"],
        )
