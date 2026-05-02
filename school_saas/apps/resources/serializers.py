# ── apps/resources/serializers.py ──────────────────────────
import os

from rest_framework import serializers

from .models import CourseResource


class CourseResourceSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CourseResource
        fields = [
            'id', 'course', 'title', 'file', 'external_url',
            'resource_type', 'uploaded_by', 'uploaded_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.full_name
        return None

    def validate_title(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'Title must be at least 2 characters.'
            )
        return value.strip()

    def validate_file(self, value):
        if value:
            # 50 MB limit
            max_size = 50 * 1024 * 1024
            if value.size > max_size:
                raise serializers.ValidationError(
                    'File must be at most 50 MB.'
                )
            # Block dangerous extensions
            blocked_extensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi']
            ext = os.path.splitext(value.name)[1].lower()
            if ext in blocked_extensions:
                raise serializers.ValidationError(
                    f'File type "{ext}" is not allowed.'
                )
        return value

    def validate(self, attrs):
        file = attrs.get('file')
        external_url = attrs.get('external_url')
        if not file and not external_url:
            raise serializers.ValidationError(
                'Either a file or an external URL must be provided.'
            )
        return attrs
