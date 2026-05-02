# ── apps/resources/admin.py ────────────────────────────────
from django.contrib import admin

from .models import CourseResource


@admin.register(CourseResource)
class CourseResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'resource_type', 'uploaded_by', 'created_at']
    list_filter = ['resource_type']
    search_fields = ['title', 'course__title']
