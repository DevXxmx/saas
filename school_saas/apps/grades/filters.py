# ── apps/grades/filters.py ─────────────────────────────────
import django_filters

from .models import Exam


class ExamFilter(django_filters.FilterSet):
    course = django_filters.UUIDFilter(field_name='course__id')
    exam_type = django_filters.CharFilter(field_name='exam_type')
    module_name = django_filters.CharFilter(
        field_name='module_name', lookup_expr='icontains'
    )

    class Meta:
        model = Exam
        fields = ['course', 'exam_type', 'module_name']
