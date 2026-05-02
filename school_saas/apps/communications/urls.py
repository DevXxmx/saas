# ── apps/communications/urls.py ────────────────────────────
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BulkEmailView,
    EmailLogViewSet,
    MarkAllNotificationsReadView,
    NotificationViewSet,
)

router = DefaultRouter()
router.register(r'emails/logs', EmailLogViewSet, basename='email-logs')
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('emails/send/', BulkEmailView.as_view(), name='bulk-email-send'),
    path(
        'notifications/mark-all-read/',
        MarkAllNotificationsReadView.as_view(),
        name='notifications-mark-all-read',
    ),
    path('', include(router.urls)),
]
