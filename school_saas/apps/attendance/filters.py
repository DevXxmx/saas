# ── apps/attendance/filters.py ─────────────────────────────
import django_filters

from .models import Attendance


class AttendanceFilter(django_filters.FilterSet):
    session = django_filters.UUIDFilter(field_name='session__id')
    enrollment = django_filters.UUIDFilter(field_name='enrollment__id')
    status = django_filters.CharFilter(field_name='status')
    date_from = django_filters.DateTimeFilter(field_name='recorded_at', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='recorded_at', lookup_expr='lte')

    class Meta:
        model = Attendance
        fields = ['session', 'enrollment', 'status', 'date_from', 'date_to']
