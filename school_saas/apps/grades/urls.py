# ── apps/grades/urls.py ────────────────────────────────────
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ExamGradeViewSet, ExamViewSet

router = DefaultRouter()
router.register(r'exams', ExamViewSet, basename='exams')

urlpatterns = [
    path('', include(router.urls)),
    # Nested grades under an exam
    path(
        'exams/<uuid:exam_pk>/grades/',
        ExamGradeViewSet.as_view({'get': 'list'}),
        name='exam-grades-list',
    ),
    path(
        'exams/<uuid:exam_pk>/grades/<uuid:pk>/',
        ExamGradeViewSet.as_view({'patch': 'partial_update'}),
        name='exam-grades-detail',
    ),
]
