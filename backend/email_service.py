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

logger = logging.getLogger("railsim.email")

def generate_secure_otp(length: int = 6) -> str:
    """Generate cryptographically secure numeric OTP."""
    digits = "0123456789"
    return "".join(secrets.choice(digits) for _ in range(length))

def get_email_template(otp: str, purpose: str = "registration") -> tuple[str, str]:
    """Return plain-text and HTML email content for OTP verification."""
    action_text = "complete your traveler account registration" if purpose == "registration" else "verify your account"
    
    plain_text = f"""RailSecurix - Identity Verification

Your one-time verification code (OTP) is: {otp}

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
      <h2 style="font-size: 18px; font-weight: 700; color: #0b2144; margin-top: 0;">Email Verification Required</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
        Thank you for choosing RailSecurix. Use the one-time verification code below to {action_text}:
      </p>

      <!-- OTP Display Box -->
      <div style="background: #f8fafc; border: 2px dashed #0b2144; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #64748b; margin-bottom: 6px;">One-Time Verification Code</span>
        <span style="display: block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0b2144; font-family: monospace;">{otp}</span>
        <span style="display: block; font-size: 12px; color: #f95c19; font-weight: 600; margin-top: 6px;">Valid for 5 minutes only</span>
      </div>

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

def _send_via_resend(api_key: str, to_email: str, otp: str, purpose: str) -> dict:
    """Send transactional email using Resend REST API."""
    url = "https://api.resend.com/emails"
    from_email = os.environ.get("RESEND_FROM_EMAIL", "RailSecurix <onboarding@resend.dev>")
    plain_text, html_content = get_email_template(otp, purpose)
    
    payload = {
        "from": from_email,
        "to": [to_email],
        "subject": f"RailSecurix - Verification Code: {otp}",
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

def _send_via_brevo(api_key: str, to_email: str, otp: str, purpose: str) -> dict:
    """Send transactional email using Brevo (Sendinblue) v3 API."""
    url = "https://api.brevo.com/v3/smtp/email"
    sender_email = (
        os.environ.get("BREVO_SENDER_EMAIL")
        or os.environ.get("BREVO_FROM_EMAIL")
        or "noreply@railsecurix.com"
    ).strip()
    sender_name = (
        os.environ.get("BREVO_SENDER_NAME")
        or os.environ.get("BREVO_FROM_NAME")
        or "Railsecurix"
    ).strip()
    plain_text, html_content = get_email_template(otp, purpose)
    
    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": to_email}],
        "subject": f"RailSecurix - Verification Code: {otp}",
        "htmlContent": html_content,
        "textContent": plain_text
    }
    
    headers = {
        "api-key": api_key.strip(),
        "Content-Type": "application/json",
        "User-Agent": "RailSecurix/2.0"
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
    except Exception as e:
        logger.error("Brevo API error: %s", e)
        raise RuntimeError(f"Brevo delivery failed: {e}")

def _send_via_smtp(to_email: str, otp: str, purpose: str) -> dict:
    """Send email using standard SMTP with STARTTLS / SSL."""
    host = os.environ.get("SMTP_SERVER", "").strip()
    port = int(os.environ.get("SMTP_PORT", "587"))
    username = os.environ.get("SMTP_USERNAME", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "").strip()
    from_email = os.environ.get("SMTP_FROM_EMAIL", username or "noreply@railsim.express").strip()
    use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    plain_text, html_content = get_email_template(otp, purpose)
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"RailSecurix - Verification Code: {otp}"
    msg["From"] = f"RailSecurix <{from_email}>"
    msg["To"] = to_email

    msg.attach(MIMEText(plain_text, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    context = ssl.create_default_context()

    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, context=context, timeout=10) as server:
                if username and password:
                    server.login(username, password)
                server.sendmail(from_email, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=10) as server:
                if use_tls:
                    server.starttls(context=context)
                if username and password:
                    server.login(username, password)
                server.sendmail(from_email, [to_email], msg.as_string())
        
        return {
            "delivered": True,
            "provider": "smtp",
            "status": "sent"
        }
    except Exception as e:
        logger.error("SMTP error: %s", e)
        raise RuntimeError(f"SMTP delivery failed: {e}")

def send_otp_email(to_email: str, otp: str, purpose: str = "registration") -> dict:
    """
    Authoritative email delivery dispatcher.
    Checks environment for Brevo, Resend, or SMTP configuration.
    Falls back safely to development server logging if no credentials are configured.
    """
    normalized_email = to_email.strip().lower()

    # 1. Check Brevo API (Primary transactional provider)
    brevo_key = os.environ.get("BREVO_API_KEY", "").strip()
    if brevo_key:
        try:
            return _send_via_brevo(brevo_key, normalized_email, otp, purpose)
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
            return _send_via_resend(resend_key, normalized_email, otp, purpose)
        except Exception as e:
            logger.warning("Resend delivery failed (%s).", e)
            # If explicit credentials fail, report error rather than silent dev fallback
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

    # 4. Check for production environment before console fallback
    is_prod = bool(
        os.environ.get('RAILWAY_ENVIRONMENT')
        or os.environ.get('IS_PRODUCTION')
        or (os.environ.get('FRONTEND_URL') and 'localhost' not in os.environ.get('FRONTEND_URL'))
    )
    if is_prod:
        logger.error("Production email dispatch halted: No live email provider (Brevo/Resend/SMTP) is configured in environment.")
        return {
            "delivered": False,
            "provider": "none",
            "status": "unconfigured",
            "error": "No transactional email provider is configured for production dispatch."
        }

    # Development mode fallback when no keys are in environment
    print("\n" + "=" * 76, file=sys.stderr)
    print(f"[RailSecurix Email Service - LOCAL DEV LOG]", file=sys.stderr)
    print(f"Recipient: {normalized_email}", file=sys.stderr)
    print(f"OTP Code:  {otp}", file=sys.stderr)
    print(f"Purpose:   {purpose}", file=sys.stderr)
    print(f"Expiry:    5 minutes", file=sys.stderr)
    print(f"Note:      Set RESEND_API_KEY or SMTP credentials in .env for live inbox delivery.", file=sys.stderr)
    print("=" * 76 + "\n", file=sys.stderr)

    return {
        "delivered": False,
        "provider": "development_console",
        "status": "dev_logged",
        "message": "OTP logged to server terminal for local verification. Set RESEND_API_KEY or SMTP in .env for live inbox dispatch."
    }
