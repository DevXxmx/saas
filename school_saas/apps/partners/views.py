# ── apps/partners/views.py ─────────────────────────────────
from rest_framework import viewsets

from utils.permissions import IsAdmin

from .models import Partner
from .serializers import PartnerSerializer


class PartnerViewSet(viewsets.ModelViewSet):
    queryset = Partner.objects.all()
    serializer_class = PartnerSerializer
    permission_classes = [IsAdmin]
    search_fields = ['name', 'contact_person', 'email']
    ordering_fields = ['name', 'created_at']
