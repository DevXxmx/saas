# ── apps/courses/serializers.py ─────────────────────────────
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError as DjValidationError
from rest_framework import serializers

from apps.accounts.serializers import UserListSerializer
from apps.students.serializers import StudentListSerializer

from .models import Course, CourseSession, CourseType, Enrollment


class CourseSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseSession
        fields = [
            'id', 'course', 'scheduled_at', 'duration_minutes',
            'link_sent', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'course', 'created_at', 'updated_at', 'link_sent']

    def validate_scheduled_at(self, value):
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError(
                'Session date cannot be in the past.'
            )
        # Validate session is within course date range
        course = self._get_course()
        if course:
            if value.date() < course.start_date:
                raise serializers.ValidationError(
                    'Session date cannot be before the course start date.'
                )
            if value.date() > course.end_date:
                raise serializers.ValidationError(
                    'Session date cannot be after the course end date.'
                )
        return value

    def validate_duration_minutes(self, value):
        if value < 1:
            raise serializers.ValidationError(
                'Duration must be at least 1 minute.'
            )
        if value > 480:
            raise serializers.ValidationError(
                'Duration must be at most 480 minutes (8 hours).'
            )
        return value

    def _get_course(self):
        """Retrieve the course from the context or existing instance."""
        view = self.context.get('view')
        if view:
            course_pk = view.kwargs.get('course_pk')
            if course_pk:
                try:
                    return Course.objects.get(pk=course_pk)
                except Course.DoesNotExist:
                    pass
        if self.instance and self.instance.course:
            return self.instance.course
        return None


class CourseResourceInlineSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    title = serializers.CharField()
    resource_type = serializers.CharField()
    external_url = serializers.URLField(required=False, allow_blank=True)


class CourseListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    enrolled_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'type', 'status', 'level', 'teacher_name',
            'enrolled_count', 'start_date', 'end_date',
        ]

    def get_teacher_name(self, obj):
        if obj.teacher:
            return obj.teacher.user.full_name
        return None


class CourseDetailSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    enrolled_count = serializers.IntegerField(read_only=True)
    sessions = CourseSessionSerializer(many=True, read_only=True)
    resources = CourseResourceInlineSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'type', 'status', 'level',
            'capacity', 'quota', 'start_date', 'end_date', 'location',
            'virtual_link', 'teacher', 'teacher_name', 'enrolled_count',
            'sessions', 'resources', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_teacher_name(self, obj):
        if obj.teacher:
            return obj.teacher.user.full_name
        return None


class CourseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'type', 'status', 'level',
            'capacity', 'quota', 'start_date', 'end_date', 'location',
            'virtual_link', 'teacher',
        ]
        read_only_fields = ['id']

    def validate_title(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                'Title must be at least 3 characters.'
            )
        return value.strip()

    def validate_capacity(self, value):
        if value < 1:
            raise serializers.ValidationError(
                'Capacity must be at least 1.'
            )
        if value > 500:
            raise serializers.ValidationError(
                'Capacity must be at most 500.'
            )
        return value

    def validate_virtual_link(self, value):
        if value:
            validator = URLValidator()
            try:
                validator(value)
            except DjValidationError:
                raise serializers.ValidationError(
                    'Virtual link must be a valid URL.'
                )
        return value

    def validate(self, attrs):
        from datetime import date
        course_type = attrs.get('type')
        teacher = attrs.get('teacher')
        if course_type == CourseType.ONLINE and teacher and not teacher.can_teach_online:
            raise serializers.ValidationError(
                'Assigned teacher does not have online teaching permission.'
            )
        start_date = attrs.get('start_date')
        if start_date and start_date < date.today():
            raise serializers.ValidationError(
                {'start_date': 'Start date cannot be in the past.'}
            )
        end_date = attrs.get('end_date')
        if end_date and start_date and end_date <= start_date:
            raise serializers.ValidationError(
                {'end_date': 'End date must be after start date.'}
            )
        if course_type == CourseType.ONLINE and not attrs.get('virtual_link'):
            raise serializers.ValidationError(
                {'virtual_link': 'Virtual link is required for online courses.'}
            )
        if course_type == CourseType.OFFLINE and not attrs.get('location'):
            raise serializers.ValidationError(
                {'location': 'Location is required for offline courses.'}
            )
        # Quota cannot exceed capacity
        quota = attrs.get('quota')
        capacity = attrs.get('capacity')
        if quota is not None and capacity is not None and quota > capacity:
            raise serializers.ValidationError(
                {'quota': 'Quota cannot exceed capacity.'}
            )
        # On update, capacity cannot be less than current enrollment count
        if self.instance and capacity is not None:
            enrolled = self.instance.enrollments.filter(is_active=True).count()
            if capacity < enrolled:
                raise serializers.ValidationError(
                    {'capacity': f'Cannot reduce capacity below current enrollment count ({enrolled}).'}
                )
        return attrs


class EnrollmentSerializer(serializers.ModelSerializer):
    student = StudentListSerializer(read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'course', 'course_title', 'student', 'payment_status',
            'enrolled_at', 'is_active', 'updated_at',
        ]
        read_only_fields = ['id', 'updated_at', 'enrolled_at']


class EnrollmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ['id', 'course', 'student', 'payment_status']
        read_only_fields = ['id', 'course']

    def validate(self, attrs):
        # course comes from the URL via perform_create, not the request body
        view = self.context.get('view')
        course_pk = view.kwargs.get('course_pk') if view else None
        student = attrs.get('student')

        if course_pk:
            try:
                course = Course.objects.get(pk=course_pk)
            except Course.DoesNotExist:
                raise serializers.ValidationError('Course not found.')

            # Check duplicate enrollment
            if student and Enrollment.objects.filter(course_id=course_pk, student=student).exists():
                raise serializers.ValidationError(
                    'This student is already enrolled in this course.'
                )

            # Check course status is active
            if course.status != 'active':
                raise serializers.ValidationError(
                    'Cannot enroll in a course that is not active.'
                )

            # Check course capacity
            active_enrollments = course.enrollments.filter(is_active=True).count()
            if active_enrollments >= course.capacity:
                raise serializers.ValidationError(
                    'This course has reached its maximum capacity.'
                )

        # Check student status is active
        if student and hasattr(student, 'status') and student.status != 'active':
            raise serializers.ValidationError(
                'Cannot enroll a student whose status is not active.'
            )

        return attrs
