# ── apps/courses/filters.py ────────────────────────────────
import django_filters

from .models import Course


class CourseFilter(django_filters.FilterSet):
    type = django_filters.CharFilter(field_name='type')
    status = django_filters.CharFilter(field_name='status')
    level = django_filters.CharFilter(field_name='level', lookup_expr='icontains')
    teacher = django_filters.UUIDFilter(field_name='teacher__id')
    teacher_user = django_filters.UUIDFilter(field_name='teacher__user__id')
    start_date_from = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    start_date_to = django_filters.DateFilter(field_name='start_date', lookup_expr='lte')

    class Meta:
        model = Course
        fields = ['type', 'status', 'level', 'teacher', 'teacher_user', 'start_date_from', 'start_date_to']
