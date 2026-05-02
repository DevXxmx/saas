# ── apps/communications/models.py ──────────────────────────
import uuid

from django.db import models


class TriggerType(models.TextChoices):
    BULK = 'bulk', 'Bulk'
    ABSENCE_WARNING = 'absence_warning', 'Absence Warning'
    SESSION_LINK = 'session_link', 'Session Link'
    PAYMENT_REMINDER = 'payment_reminder', 'Payment Reminder'
    ENROLLMENT_CONF = 'enrollment_confirmation', 'Enrollment Confirmation'
    GRADE_REPORT = 'grade_report', 'Grade Report'


class EmailStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    SENT = 'sent', 'Sent'
    FAILED = 'failed', 'Failed'


class EmailLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.CharField(max_length=300)
    body = models.TextField()
    recipient_type = models.CharField(max_length=50)
    recipient_ids = models.JSONField()
    trigger_type = models.CharField(max_length=50, choices=TriggerType.choices)
    status = models.CharField(
        max_length=20, choices=EmailStatus.choices, default=EmailStatus.PENDING
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    sent_by = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='sent_emails'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Email Log'
        verbose_name_plural = 'Email Logs'

    def __str__(self):
        return f"{self.subject} [{self.status}]"


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    body = models.TextField()
    notif_type = models.CharField(max_length=50)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f"{self.title} → {self.recipient}"
