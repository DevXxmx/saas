# ── apps/grades/models.py ──────────────────────────────────
import uuid

from django.db import models


class ExamType(models.TextChoices):
    MIDTERM = 'midterm', 'Midterm'
    FINAL = 'final', 'Final'
    QUIZ = 'quiz', 'Quiz'
    PROJECT = 'project', 'Project'


class Exam(models.Model):
    """
    An exam / quiz / project assessment linked to a course.
    When created, a Grade row is auto-generated for each active enrollment.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        'courses.Course', on_delete=models.CASCADE, related_name='exams'
    )
    title = models.CharField(max_length=200)
    exam_type = models.CharField(max_length=20, choices=ExamType.choices)
    module_name = models.CharField(max_length=200)
    created_by = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, null=True,
        related_name='created_exams'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Exam'
        verbose_name_plural = 'Exams'

    def __str__(self):
        return f"{self.title} — {self.course.title}"


class Grade(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam = models.ForeignKey(
        Exam, on_delete=models.CASCADE, related_name='grades',
        null=True, blank=True,
    )
    enrollment = models.ForeignKey(
        'courses.Enrollment', on_delete=models.CASCADE, related_name='grades'
    )
    # ── Legacy fields kept for data migration ──
    module_name = models.CharField(max_length=200, blank=True, default='')
    exam_type = models.CharField(
        max_length=20, choices=ExamType.choices, blank=True, default=''
    )
    mark = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    grade_letter = models.CharField(max_length=2, blank=True)
    graded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-graded_at']
        verbose_name = 'Grade'
        verbose_name_plural = 'Grades'

    def __str__(self):
        mod = self.exam.module_name if self.exam else self.module_name
        return f"{self.enrollment.student} — {mod}: {self.mark}"

    def save(self, *args, **kwargs):
        if self.mark is not None:
            self.grade_letter = self._compute_letter()
        else:
            self.grade_letter = ''
        super().save(*args, **kwargs)

    def _compute_letter(self):
        m = float(self.mark)
        if m >= 90:
            return 'A+'
        if m >= 85:
            return 'A'
        if m >= 80:
            return 'B+'
        if m >= 75:
            return 'B'
        if m >= 70:
            return 'C+'
        if m >= 65:
            return 'C'
        if m >= 50:
            return 'D'
        return 'F'
