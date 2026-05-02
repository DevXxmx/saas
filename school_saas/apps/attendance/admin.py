# ── apps/attendance/admin.py ───────────────────────────────
from django.contrib import admin

from .models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['enrollment', 'session', 'status', 'consecutive_absences', 'recorded_at']
    list_filter = ['status', 'recorded_at']
    search_fields = [
        'enrollment__student__first_name',
        'enrollment__student__last_name',
        'session__course__title',
    ]
