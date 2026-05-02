# ── apps/accounts/urls.py ──────────────────────────────────
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeView,
    RefreshTokenView,
    TeacherScheduleView,
    TeacherViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'teachers', TeacherViewSet, basename='teachers')

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('teachers/<uuid:pk>/schedule/', TeacherScheduleView.as_view(), name='teacher-schedule'),
    path('', include(router.urls)),
]
