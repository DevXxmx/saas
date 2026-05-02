# ── apps/students/serializers.py ────────────────────────────
import re

from rest_framework import serializers

from .models import Student

PHONE_REGEX = re.compile(r'^\+?[0-9\s\-]{7,20}$')


class StudentListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Student
        fields = ['id', 'full_name', 'email', 'status', 'year_enrolled']


class EnrollmentSummarySerializer(serializers.Serializer):
    course_id = serializers.UUIDField()
    course_title = serializers.CharField()
    payment_status = serializers.CharField()
    is_active = serializers.BooleanField()
    enrolled_at = serializers.DateTimeField()


class StudentDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    enrollments_summary = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email',
            'date_of_birth', 'national_id', 'phone', 'photo',
            'year_enrolled', 'status', 'created_at', 'updated_at',
            'enrollments_summary',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_first_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'First name must be at least 2 characters.'
            )
        return value.strip()

    def validate_last_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'Last name must be at least 2 characters.'
            )
        return value.strip()

    def validate_phone(self, value):
        if value and not PHONE_REGEX.match(value):
            raise serializers.ValidationError(
                'Invalid phone number format.'
            )
        return value

    def validate_date_of_birth(self, value):
        from datetime import date
        if value >= date(2020, 1, 1):
            raise serializers.ValidationError(
                'Birthday must be before 2020.'
            )
        return value

    def validate_national_id(self, value):
        if Student.objects.filter(national_id=value).exists():
            if not self.instance or self.instance.national_id != value:
                raise serializers.ValidationError(
                    'A student with this national ID already exists.'
                )
        return value

    def validate_year_enrolled(self, value):
        from datetime import date
        current_year = date.today().year
        if value < 2000 or value > current_year:
            raise serializers.ValidationError(
                f'Year must be between 2000 and {current_year}.'
            )
        return value

    def get_enrollments_summary(self, obj):
        enrollments = obj.enrollments.select_related('course').all()
        return [
            {
                'course_id': str(e.course.id),
                'course_title': e.course.title,
                'payment_status': e.payment_status,
                'is_active': e.is_active,
                'enrolled_at': e.enrolled_at,
            }
            for e in enrollments
        ]


class StudentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'email', 'date_of_birth',
            'national_id', 'phone', 'photo', 'year_enrolled', 'status',
        ]
        read_only_fields = ['id']

    def validate_first_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'First name must be at least 2 characters.'
            )
        return value.strip()

    def validate_last_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'Last name must be at least 2 characters.'
            )
        return value.strip()

    def validate_phone(self, value):
        if value and not PHONE_REGEX.match(value):
            raise serializers.ValidationError(
                'Invalid phone number format.'
            )
        return value

    def validate_date_of_birth(self, value):
        from datetime import date
        if value >= date(2020, 1, 1):
            raise serializers.ValidationError(
                'Birthday must be before 2020.'
            )
        return value

    def validate_national_id(self, value):
        if Student.objects.filter(national_id=value).exists():
            if not self.instance or self.instance.national_id != value:
                raise serializers.ValidationError(
                    'A student with this national ID already exists.'
                )
        return value

    def validate_year_enrolled(self, value):
        from datetime import date
        current_year = date.today().year
        if value < 2000 or value > current_year:
            raise serializers.ValidationError(
                f'Year must be between 2000 and {current_year}.'
            )
        return value
