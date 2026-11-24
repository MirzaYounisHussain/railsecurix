"""
RailSim Express - Transactional Email Delivery Service
Handles secure verification OTP generation and delivery via:
1. Resend API (HTTP REST, zero external dependencies)
2. Brevo API (HTTP REST)
3. Standard SMTP (Gmail, Outlook, SendGrid, Amazon SES, or custom relay)
4. Local Development Fallback (Console output when credentials are not yet configured)
"""

import os
import sys
import json
import logging
import secrets
import smtplib
import ssl
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
load_dotenv(os.path.join(BASE_DIR, '.env'))
load_dotenv(os.path.join(BASE_DIR, '.env.local'), override=True)

logger = logging.getLogger("railsim.email")

def get_brevo_api_key() -> str:
    """Return sanitized Brevo API key from local environment with quotes and whitespace stripped."""
    load_dotenv(os.path.join(BASE_DIR, '.env'))
    load_dotenv(os.path.join(BASE_DIR, '.env.local'), override=True)
    raw = os.environ.get("BREVO_API_KEY") or os.getenv("BREVO_API_KEY") or ""
    return raw.strip().strip('"').strip("'").strip()

def generate_secure_otp(length: int = 6) -> str:
    """Generate cryptographically secure numeric OTP."""
    digits = "0123456789"
    return "".join(secrets.choice(digits) for _ in range(length))

def get_email_template(otp: str, purpose: str = "registration", username: str = "", password: str = "", to_email: str = "") -> tuple[str, str]:
    """Return plain-text and HTML email content for OTP verification."""
    is_registration = (purpose == "registration")
    is_reset = (purpose in ("password_reset", "reset_password", "forgot_password"))

    if is_registration:
        subject_title = "Email Verification Required"
        action_text = "complete your traveler account registration"
        credentials_box_html = f"""
      <!-- Account Credentials Summary Box -->
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
        <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; color: #475569; margin-bottom: 10px;">Your Chosen Account Credentials</span>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding: 5px 0; width: 110px; font-weight: 600;">Username:</td>
            <td style="color: #0b2144; font-weight: 700; font-family: monospace; font-size: 14px;">{username or '—'}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 5px 0; width: 110px; font-weight: 600;">Password:</td>
            <td style="color: #0b2144; font-weight: 700; font-family: monospace; font-size: 14px;">{password or '—'}</td>
          </tr>
        </table>
        <span style="display: block; font-size: 11px; color: #94a3b8; margin-top: 8px;">Please save these credentials safely. You will use them to sign in after verification.</span>
      </div>"""
        credentials_box_plain = f"""
Your Chosen Account Credentials:
- Username: {username or '—'}
- Password: {password or '—'}
"""
    elif is_reset:
        subject_title = "Password Reset Verification"
        action_text = "reset your RailSecurix account password"
        credentials_box_html = f"""
      <!-- Registered Account Details Box -->
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
        <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; color: #475569; margin-bottom: 10px;">Registered Account Details</span>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding: 5px 0; width: 110px; font-weight: 600;">Username:</td>
            <td style="color: #0b2144; font-weight: 700; font-family: monospace; font-size: 14px;">{username or '—'}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 5px 0; width: 110px; font-weight: 600;">Registered Email:</td>
            <td style="color: #0b2144; font-weight: 700; font-size: 13px;">{to_email or '—'}</td>
          </tr>
        </table>
        <span style="display: block; font-size: 11px; color: #94a3b8; margin-top: 8px;">Use your registered username above along with your new password to sign in after reset.</span>
      </div>"""
        credentials_box_plain = f"""
Registered Account Details:
- Username: {username or '—'}
- Registered Email: {to_email or '—'}
"""
    else:
        subject_title = "Identity Verification Required"
        action_text = "verify your RailSecurix account"
        credentials_box_html = ""
        credentials_box_plain = ""

    plain_text = f"""RailSecurix - {subject_title}

Your one-time verification code (OTP) is: {otp}
{credentials_box_plain}
Enter this code within 5 minutes to {action_text}.
If you did not request this verification, please ignore this email.

RailSecurix Security Team
Simulated Online Railway Booking & Behavioral Cybersecurity System
"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>RailSecurix Verification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);">
    <!-- Header -->
    <div style="background: #0b2144; padding: 24px 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
        RailSecurix
      </h1>
      <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Secure Railway Reservation Portal</p>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0b2144; margin-top: 0;">{subject_title}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
        Thank you for choosing RailSecurix. Use the one-time verification code below to {action_text}:
      </p>

      <!-- OTP Display Box -->
      <div style="background: #f8fafc; border: 2px dashed #0b2144; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #64748b; margin-bottom: 6px;">One-Time Verification Code</span>
        <span style="display: block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0b2144; font-family: monospace;">{otp}</span>
        <span style="display: block; font-size: 12px; color: #f95c19; font-weight: 600; margin-top: 6px;">Valid for 5 minutes only</span>
      </div>
{credentials_box_html}
      <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 20px 0 0 0;">
        For your security, never share this code with anyone. RailSecurix staff will never ask for your verification code. If you did not initiate this request, you can safely disregard this message.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 11px; color: #94a3b8;">
      &copy; 2026 RailSecurix &bull; AI-Secured Behavioral Cybersecurity Architecture
    </div>
  </div>
</body>
</html>"""

    return plain_text, html_content

def _send_via_resend(api_key: str, to_email: str, otp: str, purpose: str, username: str = "", password: str = "") -> dict:
    """Send transactional email using Resend REST API."""
    url = "https://api.resend.com/emails"
    from_email = os.environ.get("RESEND_FROM_EMAIL", "RailSecurix <onboarding@resend.dev>")
    plain_text, html_content = get_email_template(otp, purpose, username, password, to_email)
    
    subject_prefix = "Password Reset Code" if purpose in ("password_reset", "reset_password", "forgot_password") else "Verification Code"
    payload = {
        "from": from_email,
        "to": [to_email],
        "subject": f"RailSecurix - {subject_prefix}: {otp}",
        "html": html_content,
        "text": plain_text
    }
    
    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json",
        "User-Agent": "RailSim-Express/2.0"
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            logger.info("Resend delivery succeeded for %s: %s", to_email, res_body.get("id"))
            return {
                "delivered": True,
                "provider": "resend",
                "messageId": res_body.get("id"),
                "status": "sent"
            }
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        logger.error("Resend API HTTP Error %s: %s", e.code, err_body)
        raise RuntimeError(f"Resend delivery failed ({e.code}): {err_body}")
    except Exception as e:
        logger.error("Resend API network error: %s", e)
        raise RuntimeError(f"Resend delivery network error: {e}")

def _send_via_brevo(api_key: str, to_email: str, otp: str, purpose: str, username: str = "", password: str = "") -> dict:
    """Send transactional email using Brevo (Sendinblue) v3 API."""
    url = "https://api.brevo.com/v3/smtp/email"
    clean_key = (api_key or "").strip().strip('"').strip("'").strip()
    sender_email = (
        os.environ.get("BREVO_SENDER_EMAIL")
        or os.environ.get("BREVO_FROM_EMAIL")
        or "mirzayounishussain786@gmail.com"
    ).strip().strip('"').strip("'")
    sender_name = (
        os.environ.get("BREVO_SENDER_NAME")
        or os.environ.get("BREVO_FROM_NAME")
        or "RailSecuriX"
    ).strip().strip('"').strip("'")
    plain_text, html_content = get_email_template(otp, purpose, username, password, to_email)
    
    subject_prefix = "Password Reset Code" if purpose in ("password_reset", "reset_password", "forgot_password") else "Verification Code"
    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": to_email}],
        "subject": f"RailSecurix - {subject_prefix}: {otp}",
        "htmlContent": html_content,
        "textContent": plain_text
    }
    
    headers = {
        "api-key": clean_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "RailSecuriX/2.0"
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            return {
                "delivered": True,
                "provider": "brevo",
                "messageId": res_body.get("messageId"),
                "status": "sent"
            }
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="replace")
        logger.error("Brevo API HTTP Error %s: %s", e.code, err_msg)
        raise RuntimeError(f"Brevo HTTP {e.code}: {err_msg}")
    except Exception as e:
        logger.error("Brevo API error: %s", e)
        raise RuntimeError(f"Brevo delivery failed: {e}")

def _send_via_smtp(to_email: str, otp: str, purpose: str, username: str = "", password: str = "") -> dict:
    """Send email using standard SMTP with STARTTLS / SSL."""
    host = os.environ.get("SMTP_SERVER", "").strip()
    port = int(os.environ.get("SMTP_PORT", "587"))
    username_smtp = os.environ.get("SMTP_USERNAME", "").strip()
    password_smtp = os.environ.get("SMTP_PASSWORD", "").strip()
    from_email = os.environ.get("SMTP_FROM_EMAIL", username_smtp or "noreply@railsim.express").strip()
    use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    plain_text, html_content = get_email_template(otp, purpose, username, password, to_email)
    subject_prefix = "Password Reset Code" if purpose in ("password_reset", "reset_password", "forgot_password") else "Verification Code"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"RailSecurix - {subject_prefix}: {otp}"
    msg["From"] = f"RailSecurix <{from_email}>"
    msg["To"] = to_email

    msg.attach(MIMEText(plain_text, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    context = ssl.create_default_context()

    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, context=context, timeout=10) as server:
                if username_smtp and password_smtp:
                    server.login(username_smtp, password_smtp)
                server.sendmail(from_email, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=10) as server:
                if use_tls:
                    server.starttls(context=context)
                if username_smtp and password_smtp:
                    server.login(username_smtp, password_smtp)
                server.sendmail(from_email, [to_email], msg.as_string())
        
        return {
            "delivered": True,
            "provider": "smtp",
            "status": "sent"
        }
    except Exception as e:
        logger.error("SMTP error: %s", e)
        raise RuntimeError(f"SMTP delivery failed: {e}")

def send_otp_email(to_email: str, otp: str, purpose: str = "registration", username: str = "", password: str = "") -> dict:
    """
    Authoritative email delivery dispatcher.
    Checks environment for Brevo API, Resend, or SMTP configuration.
    Falls back safely to development server logging if no credentials are configured.
    """
    normalized_email = to_email.strip().lower()

    # 1. Check Brevo REST HTTP API (primary provider)
    brevo_key = get_brevo_api_key()
    if brevo_key:
        try:
            return _send_via_brevo(brevo_key, normalized_email, otp, purpose, username, password)
        except Exception as e:
            logger.warning("Brevo delivery failed (%s).", e)
            return {
                "delivered": False,
                "provider": "brevo",
                "error": str(e),
                "status": "error"
            }

    # 2. Check Resend API
    resend_key = os.environ.get("RESEND_API_KEY", "").strip()
    if resend_key:
        try:
            return _send_via_resend(resend_key, normalized_email, otp, purpose, username, password)
        except Exception as e:
            logger.warning("Resend delivery failed (%s). Falling back.", e)
            return {
                "delivered": False,
                "provider": "resend",
                "error": str(e),
                "status": "error"
            }

    # 3. Check SMTP
    smtp_server = os.environ.get("SMTP_SERVER", "").strip()
    if smtp_server:
        try:
            return _send_via_smtp(normalized_email, otp, purpose, username, password)
        except Exception as e:
            logger.warning("SMTP delivery failed (%s). Falling back.", e)
            return {
                "delivered": False,
                "provider": "smtp",
                "error": str(e),
                "status": "error"
            }

    # 2. Check Resend API
    resend_key = os.environ.get("RESEND_API_KEY", "").strip()
    if resend_key:
        try:
            return _send_via_resend(resend_key, normalized_email, otp, purpose)
        except Exception as e:
            logger.warning("Resend delivery failed (%s). Falling back.", e)
            return {
                "delivered": False,
                "provider": "resend",
                "error": str(e),
                "status": "error"
            }

    # 3. Check SMTP
    smtp_server = os.environ.get("SMTP_SERVER", "").strip()
    if smtp_server:
        try:
            return _send_via_smtp(normalized_email, otp, purpose)
        except Exception as e:
            logger.warning("SMTP delivery failed (%s). Falling back.", e)
            return {
                "delivered": False,
                "provider": "smtp",
                "error": str(e),
                "status": "error"
            }

    # 4. Development mode fallback when no keys are in environment
    print("\n" + "=" * 76, file=sys.stderr)
    print(f"[RailSecurix Email Service - LOCAL DEV LOG]", file=sys.stderr)
    print(f"Recipient: {normalized_email}", file=sys.stderr)
    print(f"OTP Code:  {otp}", file=sys.stderr)
    print(f"Purpose:   {purpose}", file=sys.stderr)
    print(f"Expiry:    5 minutes", file=sys.stderr)
    print(f"Note:      Paste your BREVO_API_KEY in .env.local for live inbox delivery.", file=sys.stderr)
    print("=" * 76 + "\n", file=sys.stderr)

    return {
        "delivered": False,
        "provider": "development_console",
        "status": "dev_logged",
        "message": "OTP logged to server terminal for local verification. Paste BREVO_API_KEY in .env.local for live inbox dispatch."
    }
