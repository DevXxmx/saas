# ── tasks/email_tasks.py ───────────────────────────────────
import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_session_link_email(self, session_id, failed_student_ids=None):
    """Send session link emails to all paid, active enrollees 30 min before session."""
    from apps.communications.models import EmailLog, TriggerType
    from apps.courses.models import CourseSession, Enrollment, PaymentStatus, ScheduledTask
    from utils.email import render_email, send_email

    try:
        session = CourseSession.objects.select_related('course').get(id=session_id)
    except CourseSession.DoesNotExist:
        logger.warning(f"CourseSession {session_id} not found.")
        return

    if session.link_sent and not failed_student_ids:
        logger.info(f"Session {session_id} link already sent.")
        return

    enrollments = Enrollment.objects.filter(
        course=session.course,
        payment_status=PaymentStatus.PAID,
        is_active=True,
    ).select_related('student')

    # On retry, only process previously failed students
    if failed_student_ids:
        enrollments = enrollments.filter(student_id__in=failed_student_ids)

    sent_ids = []
    new_failed_ids = []
    for enrollment in enrollments:
        student = enrollment.student
        context = {
            'student_name': student.full_name,
            'course_title': session.course.title,
            'session_date': session.scheduled_at.strftime('%B %d, %Y'),
            'session_time': session.scheduled_at.strftime('%I:%M %p'),
            'virtual_link': session.course.virtual_link,
            'duration_minutes': session.duration_minutes,
        }
        html_content = render_email('emails/session_link.html', context)
        subject = f"Session Link: {session.course.title}"
        try:
            send_email(to=student.email, subject=subject, html_content=html_content)
            sent_ids.append(str(student.id))
        except Exception as exc:
            logger.error(f"Failed to send session link to {student.email}: {exc}")
            new_failed_ids.append(str(student.id))

    # If some emails failed, retry with only the failed students
    if new_failed_ids and self.request.retries < self.max_retries:
        self.retry(
            kwargs={'session_id': session_id, 'failed_student_ids': new_failed_ids},
            countdown=60,
        )

    # Log successfully sent emails
    if sent_ids:
        EmailLog.objects.create(
            subject=f"Session Link: {session.course.title}",
            body=f"Session link sent for {session.course.title}",
            recipient_type='students',
            recipient_ids=sent_ids,
            trigger_type=TriggerType.SESSION_LINK,
            status='sent',
            sent_at=timezone.now(),
        )

    if not session.link_sent:
        session.link_sent = True
        session.save(update_fields=['link_sent'])

    ScheduledTask.objects.filter(
        task_type='session_link',
        payload__session_id=session_id,
        status='pending',
    ).update(status='done')


@shared_task(bind=True, max_retries=3)
def send_absence_warning_email(self, enrollment_id):
    """Send absence warning email to a student with 3 consecutive absences."""
    from django.conf import settings

    from apps.communications.models import EmailLog, TriggerType
    from apps.courses.models import Enrollment
    from utils.email import render_email, send_email

    try:
        enrollment = Enrollment.objects.select_related(
            'student', 'course'
        ).get(id=enrollment_id)
    except Enrollment.DoesNotExist:
        logger.warning(f"Enrollment {enrollment_id} not found.")
        return

    student = enrollment.student
    course = enrollment.course

    context = {
        'student_name': student.full_name,
        'course_title': course.title,
        'absence_count': 3,
        'school_email': settings.SCHOOL_EMAIL,
        'school_phone': settings.SCHOOL_PHONE,
    }
    html_content = render_email('emails/absence_warning.html', context)
    subject = f"Absence Warning: {course.title}"

    try:
        send_email(to=student.email, subject=subject, html_content=html_content)
    except Exception as exc:
        logger.error(f"Failed to send absence warning to {student.email}: {exc}")
        self.retry(exc=exc, countdown=60)
        return  # retry() raises Retry, but guard anyway

    EmailLog.objects.create(
        subject=subject,
        body=html_content,
        recipient_type='students',
        recipient_ids=[str(student.id)],
        trigger_type=TriggerType.ABSENCE_WARNING,
        status='sent',
        sent_at=timezone.now(),
    )


@shared_task(bind=True, max_retries=3)
def send_payment_reminder_email(self):
    """Periodic task: send payment reminders for all overdue enrollments."""
    from apps.communications.models import EmailLog, TriggerType
    from apps.courses.models import Enrollment, PaymentStatus
    from utils.email import render_email, send_email

    overdue_enrollments = Enrollment.objects.filter(
        payment_status=PaymentStatus.OVERDUE,
        is_active=True,
    ).select_related('student', 'course')

    for enrollment in overdue_enrollments:
        student = enrollment.student
        course = enrollment.course

        context = {
            'student_name': student.full_name,
            'course_title': course.title,
        }
        html_content = render_email('emails/payment_reminder.html', context)
        subject = f"Payment Reminder: {course.title}"

        try:
            send_email(to=student.email, subject=subject, html_content=html_content)
            EmailLog.objects.create(
                subject=subject,
                body=html_content,
                recipient_type='students',
                recipient_ids=[str(student.id)],
                trigger_type=TriggerType.PAYMENT_REMINDER,
                status='sent',
                sent_at=timezone.now(),
            )
        except Exception as exc:
            logger.error(f"Failed to send payment reminder to {student.email}: {exc}")
            EmailLog.objects.create(
                subject=subject,
                body=html_content,
                recipient_type='students',
                recipient_ids=[str(student.id)],
                trigger_type=TriggerType.PAYMENT_REMINDER,
                status='failed',
            )


@shared_task(bind=True, max_retries=3)
def send_bulk_email(self, subject, body, recipient_emails, log_id):
    """Send bulk email to a list of recipients."""
    from apps.communications.models import EmailLog
    from utils.email import send_email

    try:
        log = EmailLog.objects.get(id=log_id)
    except EmailLog.DoesNotExist:
        logger.warning(f"EmailLog {log_id} not found.")
        return

    failed = False
    for email_addr in recipient_emails:
        try:
            send_email(to=email_addr, subject=subject, html_content=body)
        except Exception as exc:
            logger.error(f"Failed to send bulk email to {email_addr}: {exc}")
            failed = True

    log.status = 'failed' if failed else 'sent'
    if not failed:
        log.sent_at = timezone.now()
    log.save(update_fields=['status', 'sent_at'])
