# ── apps/attendance/serializers.py ─────────────────────────
from rest_framework import serializers

from .models import Attendance, AttendanceStatus


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    session_date = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            'id', 'session', 'enrollment', 'status',
            'consecutive_absences', 'recorded_at', 'student_name',
            'course_title', 'session_date',
        ]
        read_only_fields = ['id', 'consecutive_absences', 'recorded_at']

    def get_student_name(self, obj):
        return obj.enrollment.student.full_name

    def get_course_title(self, obj):
        return obj.session.course.title if obj.session and obj.session.course else None

    def get_session_date(self, obj):
        return obj.session.scheduled_at.isoformat() if obj.session else None

    def validate(self, attrs):
        session = attrs.get('session')
        enrollment = attrs.get('enrollment')
        # Ensure session belongs to the same course as the enrollment
        if session and enrollment:
            if session.course_id != enrollment.course_id:
                raise serializers.ValidationError(
                    'Session does not belong to the same course as the enrollment.'
                )
        return attrs


class AttendanceRecordInputSerializer(serializers.Serializer):
    enrollment_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=AttendanceStatus.choices)


class BulkAttendanceSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    records = AttendanceRecordInputSerializer(many=True)

    def validate_records(self, value):
        if not value:
            raise serializers.ValidationError('At least one record is required.')
        # Check for duplicate enrollment IDs
        enrollment_ids = [r['enrollment_id'] for r in value]
        if len(enrollment_ids) != len(set(enrollment_ids)):
            raise serializers.ValidationError(
                'Duplicate enrollment IDs found in records.'
            )
        return value

    def validate(self, attrs):
        from apps.courses.models import CourseSession
        from django.utils import timezone

        session_id = attrs.get('session_id')
        try:
            session = CourseSession.objects.select_related('course').get(pk=session_id)
        except CourseSession.DoesNotExist:
            raise serializers.ValidationError(
                {'session_id': 'Session not found.'}
            )

        # Validate each enrollment belongs to this course
        records = attrs.get('records', [])
        from apps.courses.models import Enrollment
        enrollment_ids = [r['enrollment_id'] for r in records]
        valid_enrollments = set(
            Enrollment.objects.filter(
                course=session.course,
                id__in=enrollment_ids,
            ).values_list('id', flat=True)
        )
        for eid in enrollment_ids:
            if eid not in valid_enrollments:
                raise serializers.ValidationError(
                    {'records': f'Enrollment {eid} does not belong to this course.'}
                )

        return attrs
