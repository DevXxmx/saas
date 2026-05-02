# ── apps/grades/admin.py ───────────────────────────────────
from django.contrib import admin

from .models import Exam, Grade


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'exam_type', 'module_name', 'created_by', 'created_at']
    list_filter = ['exam_type']
    search_fields = ['title', 'module_name', 'course__title']


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['enrollment', 'exam', 'mark', 'grade_letter']
    list_filter = ['grade_letter']
    search_fields = [
        'enrollment__student__first_name',
        'enrollment__student__last_name',
        'exam__title',
    ]
