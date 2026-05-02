# ── apps/audit/admin.py ────────────────────────────────────
from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'model_affected', 'object_id', 'user', 'timestamp']
    list_filter = ['action', 'model_affected', 'timestamp']
    search_fields = ['object_id', 'user__email', 'model_affected']
    readonly_fields = [
        'user', 'action', 'model_affected', 'object_id',
        'changes', 'timestamp', 'ip_address',
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
