# ── apps/resources/views.py ────────────────────────────────
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from utils.permissions import IsAdmin

from .models import CourseResource
from .serializers import CourseResourceSerializer


class CourseResourceViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = CourseResourceSerializer

    def get_queryset(self):
        qs = CourseResource.objects.select_related('course', 'uploaded_by')
        user = self.request.user
        if user.role == 'teacher' and hasattr(user, 'teacher_profile'):
            qs = qs.filter(course__teacher=user.teacher_profile)
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
        teacher_user = self.request.query_params.get('teacher_user')
        if teacher_user:
            qs = qs.filter(course__teacher__user__id=teacher_user)
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            qs = qs.filter(resource_type=resource_type)
        return qs

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdmin()]
        if self.action == 'create':
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
