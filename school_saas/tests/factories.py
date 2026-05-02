# ── tests/factories.py ─────────────────────────────────────
import datetime
import uuid

import factory
from django.utils import timezone

from apps.accounts.models import CustomUser, Teacher
from apps.attendance.models import Attendance
from apps.courses.models import Course, CourseSession, Enrollment
from apps.grades.models import Grade
from apps.students.models import Student


class CustomUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CustomUser

    id = factory.LazyFunction(uuid.uuid4)
    email = factory.Sequence(lambda n: f"user{n}@school.test")
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    role = 'admin'
    is_active = True
    password = factory.PostGenerationMethodCall('set_password', 'TestPass123!')


class TeacherFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Teacher

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(CustomUserFactory, role='teacher')
    specialization = factory.Faker('job')
    contract_type = 'full_time'
    can_teach_online = True


class StudentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Student

    id = factory.LazyFunction(uuid.uuid4)
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    email = factory.Sequence(lambda n: f"student{n}@school.test")
    date_of_birth = factory.LazyFunction(lambda: datetime.date(2000, 1, 15))
    national_id = factory.Sequence(lambda n: f"NID{n:08d}")
    year_enrolled = 2024
    status = 'active'


class CourseFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Course

    id = factory.LazyFunction(uuid.uuid4)
    title = factory.Sequence(lambda n: f"Course {n}")
    type = 'offline'
    status = 'active'
    level = 'Beginner'
    capacity = 30
    start_date = factory.LazyFunction(lambda: datetime.date.today())
    end_date = factory.LazyFunction(
        lambda: datetime.date.today() + datetime.timedelta(days=90)
    )
    teacher = factory.SubFactory(TeacherFactory)


class CourseSessionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CourseSession

    id = factory.LazyFunction(uuid.uuid4)
    course = factory.SubFactory(CourseFactory)
    scheduled_at = factory.LazyFunction(
        lambda: timezone.now() + datetime.timedelta(days=1)
    )
    duration_minutes = 90


class EnrollmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Enrollment

    id = factory.LazyFunction(uuid.uuid4)
    course = factory.SubFactory(CourseFactory)
    student = factory.SubFactory(StudentFactory)
    payment_status = 'paid'
    is_active = True


class AttendanceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Attendance

    id = factory.LazyFunction(uuid.uuid4)
    session = factory.SubFactory(CourseSessionFactory)
    enrollment = factory.SubFactory(EnrollmentFactory)
    status = 'present'


class GradeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Grade

    id = factory.LazyFunction(uuid.uuid4)
    enrollment = factory.SubFactory(EnrollmentFactory)
    module_name = factory.Sequence(lambda n: f"Module {n}")
    mark = 85.00
    exam_type = 'midterm'
