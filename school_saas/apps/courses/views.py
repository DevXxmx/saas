# ── apps/courses/views.py ──────────────────────────────────
from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.response import Response

from utils.permissions import IsAdmin, IsAdminOrHR, IsAdminOrReadOnly

from .filters import CourseFilter
from .models import Course, CourseSession, CourseStatus, Enrollment
from .serializers import (
    CourseCreateSerializer,
    CourseDetailSerializer,
    CourseListSerializer,
    CourseSessionSerializer,
    EnrollmentCreateSerializer,
    EnrollmentSerializer,
)


class CourseViewSet(viewsets.ModelViewSet):
    filterset_class = CourseFilter
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'start_date', 'created_at']

    def get_queryset(self):
        qs = Course.objects.select_related('teacher__user').annotate(
            enrolled_count=Count('enrollments', filter=Q(enrollments__is_active=True))
        )
        user = self.request.user
        if user.role == 'teacher' and hasattr(user, 'teacher_profile'):
            qs = qs.filter(teacher=user.teacher_profile)
        return qs

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAdminOrReadOnly()]

    def get_serializer_class(self):
        if self.action == 'list':
            return CourseListSerializer
        if self.action == 'create':
            return CourseCreateSerializer
        return CourseDetailSerializer

    def destroy(self, request, *args, **kwargs):
        course = self.get_object()
        course.status = CourseStatus.CANCELLED
        course.save()
        return Response(
            {'detail': 'Course cancelled.'},
            status=status.HTTP_200_OK,
        )


class CourseSessionViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSessionSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAdminOrReadOnly()]

    def get_queryset(self):
        qs = CourseSession.objects.filter(
            course_id=self.kwargs['course_pk']
        )
        user = self.request.user
        if user.role == 'teacher' and hasattr(user, 'teacher_profile'):
            qs = qs.filter(course__teacher=user.teacher_profile)
        return qs

    def perform_create(self, serializer):
        course = Course.objects.get(pk=self.kwargs['course_pk'])
        serializer.save(course=course)


class EnrollmentViewSet(viewsets.ModelViewSet):

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAdminOrReadOnly()]

    def get_queryset(self):
        qs = Enrollment.objects.filter(
            course_id=self.kwargs['course_pk']
        ).select_related('student', 'course')
        user = self.request.user
        if user.role == 'teacher' and hasattr(user, 'teacher_profile'):
            qs = qs.filter(course__teacher=user.teacher_profile)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return EnrollmentCreateSerializer
        return EnrollmentSerializer

    def perform_create(self, serializer):
        course = Course.objects.get(pk=self.kwargs['course_pk'])
        serializer.save(course=course)
