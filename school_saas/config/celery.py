# ── config/celery.py ───────────────────────────────────────
import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('school_saas')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks(['tasks'])

from tasks.beat_schedule import CELERY_BEAT_SCHEDULE  # noqa: E402
app.conf.beat_schedule = CELERY_BEAT_SCHEDULE
