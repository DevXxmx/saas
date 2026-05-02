# ── apps/students/admin.py ─────────────────────────────────
from django.contrib import admin

from apps.courses.models import Enrollment

from .models import Student


class EnrollmentInline(admin.TabularInline):
    model = Enrollment
    extra = 0
    readonly_fields = ['course', 'payment_status', 'enrolled_at', 'is_active']
    can_delete = False


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'status', 'year_enrolled']
    list_filter = ['status', 'year_enrolled']
    search_fields = ['first_name', 'last_name', 'email', 'national_id']
    inlines = [EnrollmentInline]
