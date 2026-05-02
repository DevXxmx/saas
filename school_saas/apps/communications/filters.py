# ── apps/communications/filters.py ─────────────────────────
from django.db.models import Q
import django_filters

from .models import EmailLog


class EmailLogFilter(django_filters.FilterSet):
    trigger_type = django_filters.CharFilter(field_name='trigger_type')
    status = django_filters.CharFilter(field_name='status')
    sent_by = django_filters.UUIDFilter(field_name='sent_by__id')
    date_from = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    partner = django_filters.UUIDFilter(method='filter_partner')

    class Meta:
        model = EmailLog
        fields = ['trigger_type', 'status', 'sent_by', 'date_from', 'date_to', 'partner']

    def filter_partner(self, queryset, name, value):
        if not value:
            return queryset

        from apps.partners.models import Partner
        try:
            partner_obj = Partner.objects.get(id=value)
            email = partner_obj.email
        except Partner.DoesNotExist:
            email = None

        # Match either the raw UUID (old logs) or the email address (new logs)
        if email:
            return queryset.filter(
                Q(recipient_ids__contains=str(value)) | Q(recipient_ids__contains=email)
            )
        return queryset.filter(recipient_ids__contains=str(value))
