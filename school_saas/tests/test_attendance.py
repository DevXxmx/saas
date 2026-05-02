# ── tests/test_attendance.py ───────────────────────────────
import datetime
from unittest.mock import patch

import pytest
from django.utils import timezone

from apps.attendance.models import Attendance
from apps.communications.models import Notification
from tests.factories import (
    CourseFactory,
    CourseSessionFactory,
    EnrollmentFactory,
    StudentFactory,
    TeacherFactory,
)


@pytest.mark.django_db
class TestAttendanceSignal:
    def _create_sessions_and_attend(self, enrollment, count, statuses):
        """Helper to create sessions and attendance records."""
        course = enrollment.course
        records = []
        for i in range(count):
            session = CourseSessionFactory(
                course=course,
                scheduled_at=timezone.now() + datetime.timedelta(hours=i),
            )
            record = Attendance.objects.create(
                session=session,
                enrollment=enrollment,
                status=statuses[i],
            )
            records.append(record)
        return records

    @patch('tasks.email_tasks.send_absence_warning_email.delay')
    def test_three_consecutive_absences_triggers_email(self, mock_task):
        """After 3 consecutive absences, the absence warning email task is called."""
        student = StudentFactory()
        course = CourseFactory()
        enrollment = EnrollmentFactory(course=course, student=student)

        statuses = ['absent', 'absent', 'absent']
        self._create_sessions_and_attend(enrollment, 3, statuses)

        mock_task.assert_called_once_with(enrollment_id=str(enrollment.id))

    @patch('tasks.email_tasks.send_absence_warning_email.delay')
    def test_two_absences_does_not_trigger(self, mock_task):
        """Two absences should not trigger the warning."""
        student = StudentFactory()
        course = CourseFactory()
        enrollment = EnrollmentFactory(course=course, student=student)

        statuses = ['absent', 'absent']
        self._create_sessions_and_attend(enrollment, 2, statuses)

        mock_task.assert_not_called()

    @patch('tasks.email_tasks.send_absence_warning_email.delay')
    def test_absence_interrupted_by_present_resets_count(self, mock_task):
        """If a student is present between absences, count resets."""
        student = StudentFactory()
        course = CourseFactory()
        enrollment = EnrollmentFactory(course=course, student=student)

        statuses = ['absent', 'absent', 'present', 'absent', 'absent']
        self._create_sessions_and_attend(enrollment, 5, statuses)

        mock_task.assert_not_called()

    @patch('tasks.email_tasks.send_absence_warning_email.delay')
    def test_notification_created_on_three_absences(self, mock_task):
        """Notification is created for admin users on 3 consecutive absences."""
        from apps.accounts.models import CustomUser
        from tests.factories import CustomUserFactory

        admin = CustomUserFactory(role='admin')
        student = StudentFactory()
        course = CourseFactory()
        enrollment = EnrollmentFactory(course=course, student=student)

        statuses = ['absent', 'absent', 'absent']
        self._create_sessions_and_attend(enrollment, 3, statuses)

        notifications = Notification.objects.filter(
            recipient=admin,
            notif_type='absence_warning',
        )
        assert notifications.exists()
        assert student.full_name in notifications.first().body


@pytest.mark.django_db
class TestBulkAttendance:
    def test_bulk_attendance_creates_records(self, api_client):
        """BulkAttendanceView creates correct attendance records."""
        teacher = TeacherFactory()
        course = CourseFactory(teacher=teacher)
        session = CourseSessionFactory(course=course)

        student1 = StudentFactory()
        student2 = StudentFactory()
        enrollment1 = EnrollmentFactory(course=course, student=student1)
        enrollment2 = EnrollmentFactory(course=course, student=student2)

        api_client.force_authenticate(user=teacher.user)

        from django.urls import reverse
        url = reverse('attendance-bulk')
        response = api_client.post(url, {
            'session_id': str(session.id),
            'records': [
                {'enrollment_id': str(enrollment1.id), 'status': 'present'},
                {'enrollment_id': str(enrollment2.id), 'status': 'absent'},
            ],
        }, format='json')

        assert response.status_code == 201
        assert Attendance.objects.filter(session=session).count() == 2
        assert Attendance.objects.get(
            session=session, enrollment=enrollment1
        ).status == 'present'
        assert Attendance.objects.get(
            session=session, enrollment=enrollment2
        ).status == 'absent'
