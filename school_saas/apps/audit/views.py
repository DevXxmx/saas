# ── apps/audit/views.py ────────────────────────────────────
from rest_framework import mixins, viewsets

from utils.permissions import IsAdmin

from .filters import AuditLogFilter
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]
    filterset_class = AuditLogFilter
    ordering_fields = ['timestamp']
