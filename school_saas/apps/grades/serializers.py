# ── apps/grades/serializers.py ─────────────────────────────
from collections import defaultdict

from django.db.models import Count, Q
from rest_framework import serializers

from .models import Exam, Grade


# ── Exam Serializers ─────────────────────────────────────


class ExamListSerializer(serializers.ModelSerializer):
    course_title = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    graded_count = serializers.IntegerField(read_only=True)
    total_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'exam_type', 'module_name', 'course',
            'course_title', 'teacher_name', 'graded_count', 'total_count',
            'created_at',
        ]

    def get_course_title(self, obj):
        return obj.course.title if obj.course else None

    def get_teacher_name(self, obj):
        if obj.course and obj.course.teacher:
            return obj.course.teacher.user.full_name
        return None


class ExamDetailSerializer(serializers.ModelSerializer):
    course_title = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    teacher_user_id = serializers.SerializerMethodField()
    graded_count = serializers.IntegerField(read_only=True)
    total_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'exam_type', 'module_name', 'course',
            'course_title', 'teacher_name', 'teacher_user_id',
            'graded_count', 'total_count',
            'created_by', 'created_at', 'updated_at',
        ]

    def get_course_title(self, obj):
        return obj.course.title if obj.course else None

    def get_teacher_name(self, obj):
        if obj.course and obj.course.teacher:
            return obj.course.teacher.user.full_name
        return None

    def get_teacher_user_id(self, obj):
        if obj.course and obj.course.teacher:
            return str(obj.course.teacher.user.id)
        return None


class ExamCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = ['id', 'course', 'title', 'exam_type', 'module_name']
        read_only_fields = ['id']

    def validate_title(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                'Title must be at least 3 characters.'
            )
        return value.strip()

    def validate_module_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'Module name must be at least 2 characters.'
            )
        return value.strip()

    def validate(self, attrs):
        request = self.context.get('request')
        course = attrs.get('course')
        if request and course:
            user = request.user
            if user.role == 'teacher':
                if not hasattr(user, 'teacher_profile'):
                    raise serializers.ValidationError(
                        'Your account does not have a teacher profile.'
                    )
                if course.teacher != user.teacher_profile:
                    raise serializers.ValidationError(
                        'You can only create exams for your own courses.'
                    )
        return attrs


# ── Grade Serializers ────────────────────────────────────


class GradeSerializer(serializers.ModelSerializer):
    """Used to display grades within an exam detail view."""
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = [
            'id', 'exam', 'enrollment', 'mark', 'grade_letter',
            'student_name', 'student_email',
            'graded_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'exam', 'enrollment', 'grade_letter',
            'graded_at', 'updated_at',
        ]

    def get_student_name(self, obj):
        return obj.enrollment.student.full_name

    def get_student_email(self, obj):
        return obj.enrollment.student.email


class GradeUpdateSerializer(serializers.ModelSerializer):
    """Used by teachers to update a grade mark only."""

    class Meta:
        model = Grade
        fields = ['id', 'mark']
        read_only_fields = ['id']

    def validate_mark(self, value):
        if value is not None:
            if value < 0 or value > 100:
                raise serializers.ValidationError(
                    'Mark must be between 0 and 100.'
                )
        return value


# ── Student Transcript Serializer ────────────────────────


class StudentTranscriptSerializer(serializers.Serializer):
    student_name = serializers.SerializerMethodField()
    modules = serializers.SerializerMethodField()

    def get_student_name(self, obj):
        return obj['student'].full_name

    def get_modules(self, obj):
        grades = obj['grades']
        grouped = defaultdict(list)
        for grade in grades:
            mod = grade.exam.module_name if grade.exam else grade.module_name
            exam_type = grade.exam.exam_type if grade.exam else grade.exam_type
            grouped[mod].append({
                'id': str(grade.id),
                'mark': float(grade.mark) if grade.mark is not None else None,
                'grade_letter': grade.grade_letter,
                'exam_type': exam_type,
                'course_title': grade.enrollment.course.title,
                'graded_at': grade.graded_at.isoformat() if grade.graded_at else None,
            })
        return [
            {'module_name': module, 'grades': grade_list}
            for module, grade_list in grouped.items()
        ]
