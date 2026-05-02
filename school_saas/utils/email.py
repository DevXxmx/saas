# ── utils/email.py ─────────────────────────────────────────
import logging

import requests
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

MAILJET_SEND_URL = 'https://api.mailjet.com/v3.1/send'


def render_email(template_name, context):
    """Render an email template to HTML string."""
    context.setdefault('school_name', settings.SCHOOL_NAME)
    context.setdefault('school_address', settings.SCHOOL_ADDRESS)
    context.setdefault('school_phone', settings.SCHOOL_PHONE)
    context.setdefault('school_email', settings.SCHOOL_EMAIL)
    return render_to_string(template_name, context)


def send_email(to, subject, html_content):
    """Send an email via Mailjet Send API v3.1 (direct HTTP).

    Raises an exception on non-success response for retry logic.

    Args:
        to: Recipient email address (str) or list of email addresses.
        subject: Email subject line.
        html_content: Rendered HTML body.
    """
    api_key = settings.MAILJET_API_KEY
    api_secret = settings.MAILJET_API_SECRET
    if not api_key or not api_secret:
        logger.warning(
            "MAILJET_API_KEY / MAILJET_API_SECRET not configured. Email not sent."
        )
        return None

    # Normalise recipients to a list
    if isinstance(to, str):
        recipients = [to]
    else:
        recipients = list(to)

    payload = {
        'Messages': [
            {
                'From': {
                    'Email': settings.DEFAULT_FROM_EMAIL,
                    'Name': settings.SCHOOL_NAME,
                },
                'To': [{'Email': addr} for addr in recipients],
                'Subject': subject,
                'HTMLPart': html_content,
            }
        ]
    }

    response = requests.post(
        MAILJET_SEND_URL,
        auth=(api_key, api_secret),
        json=payload,
        timeout=30,
    )

    if response.status_code != 200:
        raise Exception(
            f"Mailjet API returned status {response.status_code}: "
            f"{response.text}"
        )

    # Check per-message status inside the 200 response
    response_json = response.json()
    messages = response_json.get('Messages', [])
    for msg in messages:
        msg_status = msg.get('Status', '')
        if msg_status == 'error':
            errors = msg.get('Errors', [])
            raise Exception(f"Mailjet message error: {errors}")

    logger.info(
        f"Email sent to {', '.join(recipients)}: {subject} "
        f"(status: {response.status_code})"
    )
    return response
