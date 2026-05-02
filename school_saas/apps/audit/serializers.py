# ── apps/audit/serializers.py ──────────────────────────────
from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    user_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'user_display', 'action', 'model_affected',
            'object_id', 'object_repr', 'changes', 'timestamp', 'ip_address',
        ]
        read_only_fields = fields

    def get_user_email(self, obj):
        if obj.user:
            return obj.user.email
        return None

    def get_user_display(self, obj):
        if obj.user:
            return obj.user.full_name
        return None
