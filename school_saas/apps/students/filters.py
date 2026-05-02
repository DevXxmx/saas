# ── apps/students/filters.py ───────────────────────────────
import django_filters
from django.db.models import Q

from .models import Student


class StudentFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status')
    year_enrolled = django_filters.NumberFilter(field_name='year_enrolled')
    course = django_filters.UUIDFilter(field_name='enrollments__course__id', distinct=True)
    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = Student
        fields = ['status', 'year_enrolled', 'course']

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value) |
            Q(email__icontains=value)
        )
