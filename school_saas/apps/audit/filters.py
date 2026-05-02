# ── apps/audit/filters.py ──────────────────────────────────
import django_filters

from .models import AuditLog


class AuditLogFilter(django_filters.FilterSet):
    user = django_filters.UUIDFilter(field_name='user__id')
    model_affected = django_filters.CharFilter(field_name='model_affected')
    action = django_filters.CharFilter(field_name='action')
    date_from = django_filters.DateTimeFilter(field_name='timestamp', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='timestamp', lookup_expr='lte')

    class Meta:
        model = AuditLog
        fields = ['user', 'model_affected', 'action', 'date_from', 'date_to']
