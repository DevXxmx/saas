# ── apps/students/views.py ─────────────────────────────────
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.grades.models import Grade
from apps.grades.serializers import StudentTranscriptSerializer
from utils.permissions import IsAdmin, IsAdminOrHR

from .filters import StudentFilter
from .models import Student, StudentStatus
from .serializers import StudentCreateSerializer, StudentDetailSerializer, StudentListSerializer


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    filterset_class = StudentFilter
    search_fields = ['first_name', 'last_name', 'email']
    ordering_fields = ['last_name', 'year_enrolled', 'created_at']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAdminOrHR()]

    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        if self.action == 'create':
            return StudentCreateSerializer
        return StudentDetailSerializer

    def destroy(self, request, *args, **kwargs):
        student = self.get_object()
        student.status = StudentStatus.DROPPED
        student.save()
        return Response(
            {'detail': 'Student status set to dropped.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'], url_path='transcript')
    def transcript(self, request, pk=None):
        student = self.get_object()
        grades = Grade.objects.filter(
            enrollment__student=student
        ).select_related('enrollment__course', 'exam').order_by('exam__module_name', 'graded_at')
        serializer = StudentTranscriptSerializer({'grades': grades, 'student': student})
        return Response(serializer.data)
