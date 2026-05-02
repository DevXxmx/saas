# ── tests/test_grades.py ───────────────────────────────────
import pytest
from decimal import Decimal

from apps.grades.models import Grade
from tests.factories import EnrollmentFactory, GradeFactory


@pytest.mark.django_db
class TestGradeLetterComputation:
    """Verify all grade letter bands."""

    @pytest.mark.parametrize("mark,expected_letter", [
        (Decimal('95.00'), 'A+'),
        (Decimal('90.00'), 'A+'),
        (Decimal('89.99'), 'A'),
        (Decimal('85.00'), 'A'),
        (Decimal('84.99'), 'B+'),
        (Decimal('80.00'), 'B+'),
        (Decimal('79.99'), 'B'),
        (Decimal('75.00'), 'B'),
        (Decimal('74.99'), 'C+'),
        (Decimal('70.00'), 'C+'),
        (Decimal('69.99'), 'C'),
        (Decimal('65.00'), 'C'),
        (Decimal('64.99'), 'D'),
        (Decimal('50.00'), 'D'),
        (Decimal('49.99'), 'F'),
        (Decimal('0.00'), 'F'),
    ])
    def test_grade_letter(self, mark, expected_letter):
        enrollment = EnrollmentFactory()
        grade = Grade.objects.create(
            enrollment=enrollment,
            module_name='Test Module',
            mark=mark,
            exam_type='midterm',
        )
        assert grade.grade_letter == expected_letter

    def test_grade_letter_set_on_save(self):
        """Grade letter is automatically computed on save."""
        grade = GradeFactory(mark=Decimal('92.50'))
        assert grade.grade_letter == 'A+'

        grade.mark = Decimal('72.00')
        grade.save()
        assert grade.grade_letter == 'C+'
