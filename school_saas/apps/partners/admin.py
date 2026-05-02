# ── apps/partners/admin.py ─────────────────────────────────
from django.contrib import admin

from .models import Partner


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'contact_person', 'email']
    list_filter = ['type']
    search_fields = ['name', 'contact_person', 'email']
