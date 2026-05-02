# ── apps/resources/models.py ───────────────────────────────
import uuid

from django.db import models


class ResourceType(models.TextChoices):
    PDF = 'pdf', 'PDF'
    VIDEO = 'video', 'Video'
    SLIDE = 'slide', 'Slide'
    LINK = 'link', 'Link'
    OTHER = 'other', 'Other'


class CourseResource(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        'courses.Course', on_delete=models.CASCADE, related_name='resources'
    )
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='resources/', blank=True, null=True)
    external_url = models.URLField(blank=True)
    resource_type = models.CharField(max_length=20, choices=ResourceType.choices)
    uploaded_by = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='uploaded_resources'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Course Resource'
        verbose_name_plural = 'Course Resources'

    def __str__(self):
        return f"{self.title} ({self.resource_type})"
