# ── apps/attendance/urls.py ────────────────────────────────
from django.urls import path

from .views import BulkAttendanceView, SessionAttendanceView, StudentAttendanceView

urlpatterns = [
    path('attendance/bulk/', BulkAttendanceView.as_view(), name='attendance-bulk'),
    path(
        'attendance/session/<uuid:session_id>/',
        SessionAttendanceView.as_view(),
        name='attendance-session',
    ),
    path(
        'attendance/student/<uuid:student_id>/',
        StudentAttendanceView.as_view(),
        name='attendance-student',
    ),
]
