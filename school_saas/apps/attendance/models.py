# ── apps/attendance/models.py ──────────────────────────────
import uuid

from django.db import models


class AttendanceStatus(models.TextChoices):
    PRESENT = 'present', 'Present'
    ABSENT = 'absent', 'Absent'
    LATE = 'late', 'Late'
    EXCUSED = 'excused', 'Excused'


class Attendance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        'courses.CourseSession', on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    enrollment = models.ForeignKey(
        'courses.Enrollment', on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    status = models.CharField(max_length=20, choices=AttendanceStatus.choices)
    consecutive_absences = models.PositiveIntegerField(default=0)
    recorded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('session', 'enrollment')
        ordering = ['-recorded_at']
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendance Records'

    def __str__(self):
        return f"{self.enrollment.student} — {self.session} — {self.status}"
