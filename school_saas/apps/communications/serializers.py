# ── apps/communications/serializers.py ─────────────────────
import uuid as _uuid

from django.core.exceptions import ValidationError as DjValidationError
from django.core.validators import validate_email
from rest_framework import serializers

from .models import EmailLog, Notification

MAX_RECIPIENTS = 200


class BulkEmailSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=300)
    body = serializers.CharField()
    recipient_type = serializers.ChoiceField(
        choices=['students', 'teachers', 'partners', 'custom']
    )
    recipient_ids = serializers.ListField(child=serializers.CharField())

    def validate_recipient_ids(self, value):
        if not value:
            raise serializers.ValidationError(
                'At least one recipient is required.'
            )
        if len(value) > MAX_RECIPIENTS:
            raise serializers.ValidationError(
                f'Cannot exceed {MAX_RECIPIENTS} recipients per email.'
            )
        return value

    def validate(self, attrs):
        recipient_type = attrs.get('recipient_type')
        recipient_ids = attrs.get('recipient_ids', [])
        if recipient_type != 'custom':
            for rid in recipient_ids:
                try:
                    _uuid.UUID(rid)
                except (ValueError, AttributeError):
                    raise serializers.ValidationError(
                        {'recipient_ids': f'Invalid UUID: {rid}'}
                    )
        else:
            for email in recipient_ids:
                try:
                    validate_email(email)
                except DjValidationError:
                    raise serializers.ValidationError(
                        {'recipient_ids': f'Invalid email address: {email}'}
                    )
        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'title', 'body', 'notif_type',
            'is_read', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'recipient', 'title', 'body', 'notif_type',
            'created_at', 'updated_at',
        ]


class EmailLogSerializer(serializers.ModelSerializer):
    sent_by_name = serializers.SerializerMethodField()
    recipient_count = serializers.SerializerMethodField()
    recipient_emails = serializers.SerializerMethodField()

    class Meta:
        model = EmailLog
        fields = [
            'id', 'subject', 'body', 'recipient_type', 'recipient_ids',
            'recipient_emails', 'recipient_count', 'trigger_type', 'status',
            'sent_at', 'sent_by', 'sent_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_sent_by_name(self, obj):
        if obj.sent_by:
            return obj.sent_by.full_name
        return None

    def get_recipient_count(self, obj):
        if isinstance(obj.recipient_ids, list):
            return len(obj.recipient_ids)
        return 0

    def get_recipient_emails(self, obj):
        """Resolve stored IDs to actual email addresses."""
        ids = obj.recipient_ids
        if not isinstance(ids, list) or not ids:
            return []

        # Check if the first entry already looks like an email
        if '@' in str(ids[0]):
            return ids

        # Old data: stored as UUIDs — resolve to emails
        from apps.accounts.models import CustomUser
        from apps.partners.models import Partner
        from apps.students.models import Student

        rtype = obj.recipient_type
        try:
            if rtype == 'students':
                return list(
                    Student.objects.filter(id__in=ids).values_list('email', flat=True)
                )
            elif rtype == 'teachers':
                return list(
                    CustomUser.objects.filter(
                        teacher_profile__id__in=ids
                    ).values_list('email', flat=True)
                ) or list(
                    CustomUser.objects.filter(
                        id__in=ids, role='teacher'
                    ).values_list('email', flat=True)
                )
            elif rtype == 'partners':
                return list(
                    Partner.objects.filter(id__in=ids).values_list('email', flat=True)
                )
        except Exception:
            pass
        return ids
