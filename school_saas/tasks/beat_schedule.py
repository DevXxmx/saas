# ── tasks/beat_schedule.py ─────────────────────────────────
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'daily-payment-reminders': {
        'task': 'tasks.email_tasks.send_payment_reminder_email',
        'schedule': crontab(hour=9, minute=0),
    },
}
