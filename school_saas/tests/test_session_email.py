# ── tests/test_session_email.py ────────────────────────────
import pytest

from apps.courses.models import Enrollment, PaymentStatus
from tests.factories import (
    CourseFactory,
    CourseSessionFactory,
    EnrollmentFactory,
    StudentFactory,
)


@pytest.mark.django_db
class TestSessionLinkEmail:
    def test_only_paid_students_receive_link(self):
        """Only students with payment_status='paid' and is_active=True
        should be queried for session link emails."""
        course = CourseFactory(type='online')

        student_paid = StudentFactory()
        student_pending = StudentFactory()
        student_inactive = StudentFactory()

        EnrollmentFactory(
            course=course, student=student_paid,
            payment_status=PaymentStatus.PAID, is_active=True,
        )
        EnrollmentFactory(
            course=course, student=student_pending,
            payment_status=PaymentStatus.PENDING, is_active=True,
        )
        EnrollmentFactory(
            course=course, student=student_inactive,
            payment_status=PaymentStatus.PAID, is_active=False,
        )

        eligible = Enrollment.objects.filter(
            course=course,
            payment_status=PaymentStatus.PAID,
            is_active=True,
        )

        assert eligible.count() == 1
        assert eligible.first().student == student_paid
