# ── apps/students/models.py ────────────────────────────────
import uuid

from django.db import models


class StudentStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    SUSPENDED = 'suspended', 'Suspended'
    GRADUATED = 'graduated', 'Graduated'
    DROPPED = 'dropped', 'Dropped'


class Student(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    date_of_birth = models.DateField()
    national_id = models.CharField(max_length=50, unique=True)
    phone = models.CharField(max_length=20, blank=True)
    photo = models.ImageField(upload_to='students/photos/', blank=True, null=True)
    year_enrolled = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20, choices=StudentStatus.choices, default=StudentStatus.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['last_name', 'first_name']
        verbose_name = 'Student'
        verbose_name_plural = 'Students'

    def __str__(self):
        return self.full_name

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
