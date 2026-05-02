# ── apps/courses/models.py ─────────────────────────────────
import uuid

from django.core.exceptions import ValidationError
from django.db import models


class CourseType(models.TextChoices):
    OFFLINE = 'offline', 'Offline'
    ONLINE = 'online', 'Online'


class CourseStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    ACTIVE = 'active', 'Active'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class PaymentStatus(models.TextChoices):
    PAID = 'paid', 'Paid'
    PENDING = 'pending', 'Pending'
    OVERDUE = 'overdue', 'Overdue'


class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=10, choices=CourseType.choices)
    status = models.CharField(
        max_length=20, choices=CourseStatus.choices, default=CourseStatus.DRAFT
    )
    level = models.CharField(max_length=100)
    capacity = models.PositiveIntegerField()
    quota = models.PositiveIntegerField(null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    location = models.CharField(max_length=200, blank=True)
    virtual_link = models.CharField(max_length=500, blank=True)
    teacher = models.ForeignKey(
        'accounts.Teacher', on_delete=models.SET_NULL,
        null=True, related_name='courses'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'

    def __str__(self):
        return self.title

    def clean(self):
        if (
            self.type == CourseType.ONLINE
            and self.teacher
            and not self.teacher.can_teach_online
        ):
            raise ValidationError(
                'Assigned teacher does not have online teaching permission.'
            )




class CourseSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='sessions'
    )
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=90)
    link_sent = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['scheduled_at']
        verbose_name = 'Course Session'
        verbose_name_plural = 'Course Sessions'

    def __str__(self):
        return f"{self.course.title} — {self.scheduled_at}"


class Enrollment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='enrollments'
    )
    student = models.ForeignKey(
        'students.Student', on_delete=models.CASCADE, related_name='enrollments'
    )
    payment_status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('course', 'student')
        ordering = ['-enrolled_at']
        verbose_name = 'Enrollment'
        verbose_name_plural = 'Enrollments'

    def __str__(self):
        return f"{self.student} → {self.course}"


class ScheduledTask(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task_type = models.CharField(max_length=50)
    payload = models.JSONField(default=dict)
    run_at = models.DateTimeField()
    status = models.CharField(max_length=20, default='pending')
    celery_task_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-run_at']
        verbose_name = 'Scheduled Task'
        verbose_name_plural = 'Scheduled Tasks'

    def __str__(self):
        return f"{self.task_type} @ {self.run_at} [{self.status}]"
