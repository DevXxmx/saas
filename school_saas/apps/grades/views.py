# ── apps/grades/views.py ───────────────────────────────────
from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from utils.permissions import IsAdmin, IsAdminOrReadOnly

from .filters import ExamFilter
from .models import Exam, Grade
from .serializers import (
    ExamCreateSerializer,
    ExamDetailSerializer,
    ExamListSerializer,
    GradeSerializer,
    GradeUpdateSerializer,
)


class ExamViewSet(viewsets.ModelViewSet):
    """
    CRUD for exams.
    - Admin & teacher can create (teacher scoped to own courses).
    - On creation, a Grade row is auto-generated for every active enrollment.
    - Only admin can delete.
    """
    filterset_class = ExamFilter
    search_fields = ['title', 'module_name']
    ordering_fields = ['created_at', 'title']

    def get_queryset(self):
        qs = Exam.objects.select_related(
            'course', 'course__teacher__user', 'created_by'
        ).annotate(
            total_count=Count('grades'),
            graded_count=Count('grades', filter=Q(grades__mark__isnull=False)),
        )
        user = self.request.user
        if user.role == 'teacher' and hasattr(user, 'teacher_profile'):
            qs = qs.filter(course__teacher=user.teacher_profile)
        return qs

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdmin()]
        if self.action in ('create', 'update', 'partial_update'):
            return [IsAuthenticated()]
        return [IsAdminOrReadOnly()]

    def get_serializer_class(self):
        if self.action == 'create':
            return ExamCreateSerializer
        if self.action == 'list':
            return ExamListSerializer
        return ExamDetailSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        exam = serializer.save(created_by=self.request.user)
        # Auto-create Grade rows for all active enrollments
        active_enrollments = exam.course.enrollments.filter(is_active=True)
        grades = [
            Grade(exam=exam, enrollment=enrollment)
            for enrollment in active_enrollments
        ]
        Grade.objects.bulk_create(grades)

    def destroy(self, request, *args, **kwargs):
        exam = self.get_object()
        exam.delete()
        return Response(
            {'detail': 'Exam and all grades deleted.'},
            status=status.HTTP_200_OK,
        )


class ExamGradeViewSet(viewsets.ModelViewSet):
    """
    Nested under an exam: list + update individual grades.
    Only the course's teacher can update marks.
    """
    serializer_class = GradeSerializer
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        return Grade.objects.filter(
            exam_id=self.kwargs['exam_pk']
        ).select_related(
            'enrollment__student', 'enrollment__course',
            'exam__course__teacher__user',
        ).order_by('enrollment__student__last_name')

    def get_serializer_class(self):
        if self.action in ('partial_update', 'update'):
            return GradeUpdateSerializer
        return GradeSerializer

    def get_permissions(self):
        if self.action in ('partial_update', 'update'):
            return [IsAuthenticated()]
        return [IsAdminOrReadOnly()]

    def update(self, request, *args, **kwargs):
        grade = self.get_object()
        user = request.user
        # Only the course's teacher can update marks
        course_teacher = grade.exam.course.teacher if grade.exam else None
        if user.role != 'teacher' or not course_teacher or course_teacher.user != user:
            return Response(
                {'detail': 'Only the course teacher can update grades.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
