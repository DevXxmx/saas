# ── apps/courses/admin.py ──────────────────────────────────
from django.contrib import admin

from .models import Course, CourseSession, Enrollment, ScheduledTask


class CourseSessionInline(admin.TabularInline):
    model = CourseSession
    extra = 0
    fields = ['scheduled_at', 'duration_minutes', 'link_sent', 'notes']


class EnrollmentInline(admin.TabularInline):
    model = Enrollment
    extra = 0
    fields = ['student', 'payment_status', 'is_active', 'enrolled_at']
    readonly_fields = ['enrolled_at']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'type', 'status', 'teacher', 'start_date']
    list_filter = ['type', 'status', 'level']
    search_fields = ['title', 'description']
    inlines = [CourseSessionInline, EnrollmentInline]


@admin.register(CourseSession)
class CourseSessionAdmin(admin.ModelAdmin):
    list_display = ['course', 'scheduled_at', 'duration_minutes', 'link_sent']
    list_filter = ['link_sent', 'scheduled_at']
    search_fields = ['course__title']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'payment_status', 'is_active', 'enrolled_at']
    list_filter = ['payment_status', 'is_active']
    search_fields = ['student__first_name', 'student__last_name', 'course__title']


@admin.register(ScheduledTask)
class ScheduledTaskAdmin(admin.ModelAdmin):
    list_display = ['task_type', 'run_at', 'status', 'celery_task_id']
    list_filter = ['task_type', 'status']
