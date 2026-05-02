# ── tests/test_enrollment.py ───────────────────────────────
import pytest
from django.urls import reverse
from rest_framework import status

from apps.courses.models import Enrollment
from tests.factories import CourseFactory, EnrollmentFactory, StudentFactory


@pytest.mark.django_db
class TestEnrollment:
    def test_cannot_enroll_same_student_twice(self, admin_client):
        """Duplicate enrollment for the same course and student should fail."""
        student = StudentFactory()
        course = CourseFactory()
        # First enrollment
        EnrollmentFactory(course=course, student=student)

        # Attempt duplicate via API
        url = reverse('course-enrollments-list', kwargs={'course_pk': course.id})
        response = admin_client.post(url, {
            'student': str(student.id),
            'course': str(course.id),
            'payment_status': 'pending',
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_successful_enrollment(self, admin_client):
        """A student can be enrolled in a course successfully."""
        student = StudentFactory()
        course = CourseFactory()
        url = reverse('course-enrollments-list', kwargs={'course_pk': course.id})
        response = admin_client.post(url, {
            'student': str(student.id),
            'course': str(course.id),
            'payment_status': 'pending',
        })
        assert response.status_code == status.HTTP_201_CREATED
        assert Enrollment.objects.filter(course=course, student=student).exists()
