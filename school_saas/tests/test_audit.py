# ── tests/test_audit.py ────────────────────────────────────
import pytest

from apps.audit.models import AuditLog
from tests.factories import StudentFactory


@pytest.mark.django_db
class TestAuditLog:
    def test_creating_student_produces_audit_log(self):
        """Creating a Student should produce an AuditLog entry with action='create'."""
        student = StudentFactory()

        logs = AuditLog.objects.filter(
            model_affected='Student',
            object_id=str(student.pk),
            action='create',
        )
        assert logs.exists()
        log = logs.first()
        assert log.model_affected == 'Student'
        assert log.action == 'create'

    def test_updating_student_produces_audit_log(self):
        """Updating a Student should produce an AuditLog entry with action='update'."""
        student = StudentFactory()
        initial_count = AuditLog.objects.filter(
            model_affected='Student',
            object_id=str(student.pk),
        ).count()

        student.first_name = 'Updated'
        student.save()

        new_count = AuditLog.objects.filter(
            model_affected='Student',
            object_id=str(student.pk),
        ).count()
        assert new_count == initial_count + 1

    def test_deleting_student_produces_audit_log(self):
        """Deleting a Student should produce an AuditLog entry with action='delete'."""
        student = StudentFactory()
        student_pk = str(student.pk)
        student.delete()

        logs = AuditLog.objects.filter(
            model_affected='Student',
            object_id=student_pk,
            action='delete',
        )
        assert logs.exists()
