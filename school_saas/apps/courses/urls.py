# ── apps/courses/urls.py ───────────────────────────────────
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CourseSessionViewSet, CourseViewSet, EnrollmentViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='courses')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'courses/<uuid:course_pk>/sessions/',
        CourseSessionViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='course-sessions-list',
    ),
    path(
        'courses/<uuid:course_pk>/sessions/<uuid:pk>/',
        CourseSessionViewSet.as_view({'patch': 'partial_update', 'delete': 'destroy'}),
        name='course-sessions-detail',
    ),
    path(
        'courses/<uuid:course_pk>/enrollments/',
        EnrollmentViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='course-enrollments-list',
    ),
    path(
        'courses/<uuid:course_pk>/enrollments/<uuid:pk>/',
        EnrollmentViewSet.as_view({'patch': 'partial_update', 'delete': 'destroy'}),
        name='course-enrollments-detail',
    ),
]
