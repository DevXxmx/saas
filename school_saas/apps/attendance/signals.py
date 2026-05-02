# ── apps/attendance/signals.py ─────────────────────────────
import logging
from datetime import timedelta

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from apps.accounts.models import CustomUser, Role
from apps.communications.models import Notification
from apps.courses.models import CourseSession, CourseType, ScheduledTask

from .models import Attendance, AttendanceStatus

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Attendance)
def handle_attendance_saved(sender, instance, created, **kwargs):
    """
    After any Attendance record is saved:
    1. Recompute consecutive_absences for this enrollment.
    2. If consecutive_absences == 3, trigger warning email and notification.
    """
    enrollment = instance.enrollment

    # Query all attendance records for this enrollment, ordered by session date DESC
    records = Attendance.objects.filter(
        enrollment=enrollment
    ).select_related('session').order_by('-session__scheduled_at')

    consecutive = 0
    for record in records:
        if record.status == AttendanceStatus.ABSENT:
            consecutive += 1
        else:
            break

    # Update using queryset to avoid recursion
    Attendance.objects.filter(pk=instance.pk).update(consecutive_absences=consecutive)

    if consecutive == 3:
        # Trigger absence warning email task
        try:
            from tasks.email_tasks import send_absence_warning_email
            send_absence_warning_email.delay(enrollment_id=str(enrollment.id))
        except Exception as e:
            logger.error(f"Failed to queue absence warning email: {e}")

        # Create notification for all admin users
        student = enrollment.student
        course = enrollment.course
        admin_users = CustomUser.objects.filter(role=Role.ADMIN, is_active=True)
        for admin_user in admin_users:
            Notification.objects.create(
                recipient=admin_user,
                title="Absence warning triggered",
                body=(
                    f"{student.full_name} has 3 consecutive absences "
                    f"in {course.title}"
                ),
                notif_type='absence_warning',
            )


@receiver(post_save, sender=CourseSession)
def schedule_session_link_email(sender, instance, created, **kwargs):
    """
    When a CourseSession is saved:
    1. Only proceed if course type is online.
    2. Schedule email 30 minutes before session.
    3. Revoke any existing scheduled task for this session.
    """
    if instance.course.type != CourseType.ONLINE:
        return

    # Guard: if the email has already been sent for this session, don't reschedule
    if instance.link_sent:
        return

    eta = instance.scheduled_at - timedelta(minutes=30)

    if eta <= timezone.now():
        return

    # Revoke any existing task for this session
    existing_tasks = ScheduledTask.objects.filter(
        task_type='session_link',
        payload__session_id=str(instance.id),
        status='pending',
    )
    for task in existing_tasks:
        if task.celery_task_id:
            try:
                from config.celery import app as celery_app
                celery_app.control.revoke(task.celery_task_id, terminate=True)
            except Exception as e:
                logger.warning(f"Failed to revoke task {task.celery_task_id}: {e}")
        task.status = 'revoked'
        task.save()

    # Schedule new task
    try:
        from tasks.email_tasks import send_session_link_email
        result = send_session_link_email.apply_async(
            kwargs={'session_id': str(instance.id)},
            eta=eta,
        )

        ScheduledTask.objects.create(
            task_type='session_link',
            payload={'session_id': str(instance.id)},
            run_at=eta,
            status='pending',
            celery_task_id=result.id,
        )
    except Exception as e:
        logger.error(f"Failed to schedule session link email: {e}")
