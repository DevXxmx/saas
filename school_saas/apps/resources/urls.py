# ── apps/resources/urls.py ─────────────────────────────────
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CourseResourceViewSet

router = DefaultRouter()
router.register(r'resources', CourseResourceViewSet, basename='resources')

urlpatterns = [
    path('', include(router.urls)),
]
