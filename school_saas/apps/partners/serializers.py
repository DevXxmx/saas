# ── apps/partners/serializers.py ───────────────────────────
import re

from rest_framework import serializers

from .models import Partner

PHONE_REGEX = re.compile(r'^\+?[0-9\s\-]{7,20}$')


class PartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = [
            'id', 'name', 'type', 'contact_person', 'email',
            'phone', 'notes', 'contract_file', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'Name must be at least 2 characters.'
            )
        return value.strip()

    def validate_contact_person(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'Contact person must be at least 2 characters.'
            )
        return value.strip()

    def validate_phone(self, value):
        if value and not PHONE_REGEX.match(value):
            raise serializers.ValidationError(
                'Invalid phone number format.'
            )
        return value

    def validate_contract_file(self, value):
        if value:
            # 10 MB limit
            max_size = 10 * 1024 * 1024
            if value.size > max_size:
                raise serializers.ValidationError(
                    'Contract file must be at most 10 MB.'
                )
            # Only allow PDF, DOC, DOCX
            allowed_extensions = ['.pdf', '.doc', '.docx']
            import os
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in allowed_extensions:
                raise serializers.ValidationError(
                    f'Allowed file types: {", ".join(allowed_extensions)}'
                )
        return value
