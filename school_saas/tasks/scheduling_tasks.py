# ── tasks/scheduling_tasks.py ──────────────────────────────
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def cleanup_expired_scheduled_tasks(self):
    """Clean up old scheduled tasks that are no longer relevant."""
    from django.utils import timezone

    from apps.courses.models import ScheduledTask

    expired = ScheduledTask.objects.filter(
        status='pending',
        run_at__lt=timezone.now(),
    )
    count = expired.update(status='expired')
    logger.info(f"Cleaned up {count} expired scheduled tasks.")
