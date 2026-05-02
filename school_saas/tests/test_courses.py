# ── tests/test_courses.py ──────────────────────────────────
import pytest
from django.core.exceptions import ValidationError

from tests.factories import CourseFactory, TeacherFactory


@pytest.mark.django_db
class TestOnlineCourseValidation:
    def test_online_course_teacher_without_permission_fails(self):
        """A teacher without can_teach_online cannot be assigned to an online course."""
        teacher = TeacherFactory(can_teach_online=False)
        course = CourseFactory.build(type='online', teacher=teacher)
        with pytest.raises(ValidationError):
            course.clean()

    def test_online_course_teacher_with_permission_succeeds(self):
        """A teacher with can_teach_online can be assigned to an online course."""
        teacher = TeacherFactory(can_teach_online=True)
        course = CourseFactory.build(type='online', teacher=teacher)
        # Should not raise
        course.clean()

    def test_offline_course_any_teacher_succeeds(self):
        """Any teacher can be assigned to an offline course."""
        teacher = TeacherFactory(can_teach_online=False)
        course = CourseFactory.build(type='offline', teacher=teacher)
        # Should not raise
        course.clean()
