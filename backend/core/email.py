import logging
from typing import List, Optional
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from core.config import settings
from pathlib import Path

logger = logging.getLogger(__name__)

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    VALIDATE_CERTS=settings.VALIDATE_CERTS
)

async def send_user_creation_email(email: str, full_name: str, password: str, role: str):
    """
    Sends a real welcome email to a new user with their credentials using FastMail.
    If SMTP credentials are not provided, it falls back to logging.
    """
    subject = f"Welcome to the Tech Yearbook Platform, {full_name}!"
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #2563eb;">Welcome to the Platform!</h2>
                <p>Hello <strong>{full_name}</strong>,</p>
                <p>An account has been created for you on the Tech Yearbook Platform.</p>
                
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Login Credentials:</strong></p>
                    <p style="margin: 5px 0;">Email: {email}</p>
                    <p style="margin: 5px 0;">Password: <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 4px;">{password}</code></p>
                    <p style="margin: 5px 0;">Role: {role.capitalize()}</p>
                </div>

                <p>You will be prompted to set up your profile on your first login.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5174/login" 
                       style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                       Login to Your Account
                    </a>
                </div>

                <p style="font-size: 0.8em; color: #666;">
                    If you didn't expect this email, please ignore it or contact the administrator.
                </p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.8em; color: #999; text-align: center;">
                    © 2026 Tech Yearbook Platform
                </p>
            </div>
        </body>
    </html>
    """

    message = MessageSchema(
        subject=subject,
        recipients=[email],
        body=body,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    
    try:
        if not settings.MAIL_USERNAME or not settings.MAIL_SERVER:
            # Fallback to logging if no SMTP settings
            logger.warning("SMTP settings not configured. Logging email instead.")
            logger.info("-" * 50)
            logger.info(f"REAL EMAIL SIMULATION (SMTP NOT CONFIGURED)")
            logger.info(f"TO: {email}")
            logger.info(f"BODY: {body}")
            logger.info("-" * 50)
            return True

        await fm.send_message(message)
        logger.info(f"Successfully sent welcome email to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {str(e)}")
        # In a real app, you might want to retry or at least log the failure
        return False

async def send_bulk_creation_emails(users: List[dict]):
    """
    Helper to send multiple emails in a batch.
    """
    for user in users:
        await send_user_creation_email(
            email=user['email'],
            full_name=user['full_name'],
            password=user['password'],
            role=user['role']
        )
