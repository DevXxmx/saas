# ── apps/students/management/commands/seed_students.py ──────
"""
Seed command: creates 30 students, enrolls them in courses,
adds sessions, grades, and attendance records.
"""
import random
from datetime import date, datetime, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.students.models import Student
from apps.courses.models import Course, CourseSession, Enrollment
from apps.grades.models import Grade
from apps.attendance.models import Attendance


# ─── Student Data ──────────────────────────────────────────
STUDENTS_DATA = [
    {"first_name": "Amira",     "last_name": "Benali",       "dob": "2001-03-15", "phone": "+213551234567"},
    {"first_name": "Youcef",    "last_name": "Hamdi",        "dob": "2000-07-22", "phone": "+213662345678"},
    {"first_name": "Fatima",    "last_name": "Zerhouni",     "dob": "2002-01-10", "phone": "+213773456789"},
    {"first_name": "Karim",     "last_name": "Bouzid",       "dob": "1999-11-05", "phone": "+213554567890"},
    {"first_name": "Nadia",     "last_name": "Aitouche",     "dob": "2001-06-18", "phone": "+213665678901"},
    {"first_name": "Mehdi",     "last_name": "Khelifi",      "dob": "2000-09-30", "phone": "+213776789012"},
    {"first_name": "Sara",      "last_name": "Djelloul",     "dob": "2002-04-25", "phone": "+213557890123"},
    {"first_name": "Amine",     "last_name": "Brahimi",      "dob": "1998-12-01", "phone": "+213668901234"},
    {"first_name": "Lina",      "last_name": "Ferhat",       "dob": "2001-08-14", "phone": "+213779012345"},
    {"first_name": "Rami",      "last_name": "Ouali",        "dob": "2000-02-28", "phone": "+213550123456"},
    {"first_name": "Hana",      "last_name": "Mansouri",     "dob": "2001-10-09", "phone": "+213661234567"},
    {"first_name": "Sofiane",   "last_name": "Taleb",        "dob": "1999-05-17", "phone": "+213772345678"},
    {"first_name": "Meriem",    "last_name": "Rahmani",      "dob": "2002-07-03", "phone": "+213553456789"},
    {"first_name": "Bilal",     "last_name": "Cherif",       "dob": "2000-01-20", "phone": "+213664567890"},
    {"first_name": "Aya",       "last_name": "Boudjema",     "dob": "2001-11-12", "phone": "+213775678901"},
    {"first_name": "Ismail",    "last_name": "Mebarki",      "dob": "1999-04-08", "phone": "+213556789012"},
    {"first_name": "Chahinez",  "last_name": "Larbi",        "dob": "2002-09-27", "phone": "+213667890123"},
    {"first_name": "Walid",     "last_name": "Saadi",        "dob": "2000-06-14", "phone": "+213778901234"},
    {"first_name": "Asma",      "last_name": "Boumediene",   "dob": "2001-03-01", "phone": "+213559012345"},
    {"first_name": "Omar",      "last_name": "Belkacem",     "dob": "1998-08-19", "phone": "+213660123456"},
    {"first_name": "Imane",     "last_name": "Haddad",       "dob": "2002-12-06", "phone": "+213771234567"},
    {"first_name": "Zakaria",   "last_name": "Moussaoui",    "dob": "2000-04-11", "phone": "+213552345678"},
    {"first_name": "Rim",       "last_name": "Bensalem",     "dob": "2001-07-29", "phone": "+213663456789"},
    {"first_name": "Nassim",    "last_name": "Guermouche",   "dob": "1999-10-15", "phone": "+213774567890"},
    {"first_name": "Dounia",    "last_name": "Ziani",        "dob": "2002-02-22", "phone": "+213555678901"},
    {"first_name": "Fares",     "last_name": "Meziane",      "dob": "2000-11-08", "phone": "+213666789012"},
    {"first_name": "Yasmine",   "last_name": "Bouazza",      "dob": "2001-05-04", "phone": "+213777890123"},
    {"first_name": "Anis",      "last_name": "Djebbari",     "dob": "1999-01-30", "phone": "+213558901234"},
    {"first_name": "Soundous",  "last_name": "Benslimane",   "dob": "2002-06-16", "phone": "+213669012345"},
    {"first_name": "Rayane",    "last_name": "Kaddour",      "dob": "2000-03-23", "phone": "+213770123456"},
]

# Module names per course style
MODULES = {
    "math":    ["Algebra", "Trigonometry", "Calculus", "Linear Algebra"],
    "science": ["Mechanics", "Thermodynamics", "Optics", "Electromagnetism"],
    "cs":      ["Data Structures", "Algorithms", "Databases", "Networking"],
    "web":     ["HTML/CSS", "JavaScript", "React", "Node.js"],
    "english": ["Grammar", "Writing", "Comprehension", "Communication"],
    "stats":   ["Descriptive Stats", "Probability", "Inference", "Regression"],
}

# Exam types
EXAM_TYPES = ["quiz", "midterm", "final", "project"]

# Attendance status weights: good students, average, poor
ATTENDANCE_PROFILES = {
    "excellent": {"present": 85, "late": 10, "excused": 4, "absent": 1},
    "good":      {"present": 70, "late": 15, "excused": 8, "absent": 7},
    "average":   {"present": 55, "late": 15, "excused": 10, "absent": 20},
    "poor":      {"present": 30, "late": 10, "excused": 10, "absent": 50},
}


def categorize_course(title):
    t = title.lower()
    if "calculus" in t or "algebra" in t:
        return "math"
    if "mechanic" in t or "physics" in t:
        return "science"
    if "data structure" in t or "algorithm" in t:
        return "cs"
    if "web" in t or "full-stack" in t:
        return "web"
    if "english" in t or "communication" in t:
        return "english"
    if "statistic" in t or "probability" in t:
        return "stats"
    return "math"


def weighted_choice(weights_dict):
    items = list(weights_dict.keys())
    weights = list(weights_dict.values())
    return random.choices(items, weights=weights, k=1)[0]


def random_mark(profile):
    """Generate a mark based on the student profile."""
    if profile == "excellent":
        return Decimal(str(round(random.gauss(88, 5), 2))).max(Decimal("0")).min(Decimal("100"))
    elif profile == "good":
        return Decimal(str(round(random.gauss(78, 8), 2))).max(Decimal("0")).min(Decimal("100"))
    elif profile == "average":
        return Decimal(str(round(random.gauss(65, 10), 2))).max(Decimal("0")).min(Decimal("100"))
    else:  # poor
        return Decimal(str(round(random.gauss(45, 12), 2))).max(Decimal("0")).min(Decimal("100"))


class Command(BaseCommand):
    help = "Seed 30 students with enrollments, grades, and attendance"

    def handle(self, *args, **options):
        random.seed(42)  # reproducible
        now = timezone.now()

        # ── 1. Get active courses ────────────────────────────
        courses = list(Course.objects.filter(status="active"))
        if not courses:
            self.stderr.write(self.style.ERROR("No active courses found. Create courses first."))
            return

        self.stdout.write(f"Found {len(courses)} active courses")

        # ── 2. Ensure each active course has sessions ─────────
        for course in courses:
            existing_sessions = course.sessions.count()
            needed = max(0, 8 - existing_sessions)  # aim for 8 sessions per course
            if needed > 0:
                base_date = course.start_date
                for i in range(needed):
                    session_date = datetime.combine(
                        base_date + timedelta(days=7 * (existing_sessions + i)),
                        datetime.min.time().replace(hour=random.choice([8, 10, 14, 16]))
                    )
                    session_dt = timezone.make_aware(session_date)
                    CourseSession.objects.create(
                        course=course,
                        scheduled_at=session_dt,
                        duration_minutes=random.choice([60, 90, 120]),
                        notes=f"Week {existing_sessions + i + 1} session",
                    )
                self.stdout.write(f"  + {needed} sessions for '{course.title}'")

        # ── 3. Create 30 students ─────────────────────────────
        created_students = []
        for i, s in enumerate(STUDENTS_DATA):
            national_id = f"NID-2026-{1000 + i}"
            email = f"{s['first_name'].lower()}.{s['last_name'].lower()}@school.edu.dz"
            year = random.choice([2023, 2024, 2025])
            status = random.choices(
                ["active", "active", "active", "active", "suspended", "graduated"],
                weights=[40, 30, 20, 5, 3, 2], k=1
            )[0]

            # skip if email already exists
            if Student.objects.filter(email=email).exists():
                student = Student.objects.get(email=email)
                self.stdout.write(f"  [skip] Student '{student.full_name}' already exists")
                created_students.append(student)
                continue

            student = Student.objects.create(
                first_name=s["first_name"],
                last_name=s["last_name"],
                email=email,
                date_of_birth=date.fromisoformat(s["dob"]),
                national_id=national_id,
                phone=s["phone"],
                year_enrolled=year,
                status=status,
            )
            created_students.append(student)
            self.stdout.write(f"  [+] Created student: {student.full_name} ({status}, {year})")

        self.stdout.write(self.style.SUCCESS(f"\n{len(created_students)} students ready"))

        # ── 4. Assign academic profiles ────────────────────────
        profiles = (
            ["excellent"] * 6 +
            ["good"] * 10 +
            ["average"] * 9 +
            ["poor"] * 5
        )
        random.shuffle(profiles)

        # ── 5. Create enrollments ──────────────────────────────
        enrollment_count = 0
        student_enrollments = {}  # student_id -> list of enrollments

        for idx, student in enumerate(created_students):
            profile = profiles[idx]
            # Each student enrolls in 1-4 courses
            num_courses = random.choices([1, 2, 3, 4], weights=[15, 40, 30, 15], k=1)[0]
            selected_courses = random.sample(courses, min(num_courses, len(courses)))

            student_enrollments[student.id] = []

            for course in selected_courses:
                payment = random.choices(
                    ["paid", "pending", "overdue"],
                    weights=[60, 25, 15], k=1
                )[0]

                enrollment, created = Enrollment.objects.get_or_create(
                    course=course,
                    student=student,
                    defaults={
                        "payment_status": payment,
                        "is_active": student.status == "active",
                    }
                )
                student_enrollments[student.id].append((enrollment, profile))
                if created:
                    enrollment_count += 1

        self.stdout.write(self.style.SUCCESS(f"\n{enrollment_count} enrollments created"))

        # ── 6. Create grades for 18+ students ──────────────────
        grade_count = 0
        students_with_grades = created_students[:20]  # first 20 get grades

        for idx, student in enumerate(students_with_grades):
            profile = profiles[idx]
            enrollments = student_enrollments.get(student.id, [])

            for enrollment, _ in enrollments:
                category = categorize_course(enrollment.course.title)
                modules = MODULES.get(category, MODULES["math"])

                # Pick 2-3 modules
                selected_modules = random.sample(modules, min(random.randint(2, 3), len(modules)))

                for module in selected_modules:
                    # Pick 1-2 exam types per module
                    exams = random.sample(EXAM_TYPES, random.randint(1, 2))
                    for exam_type in exams:
                        mark = random_mark(profile)
                        mark = max(Decimal("0"), min(Decimal("100"), mark))

                        Grade.objects.get_or_create(
                            enrollment=enrollment,
                            module_name=module,
                            exam_type=exam_type,
                            defaults={"mark": mark},
                        )
                        grade_count += 1

        self.stdout.write(self.style.SUCCESS(f"{grade_count} grades created"))

        # ── 7. Create attendance for 15+ students ──────────────
        attendance_count = 0
        students_with_attendance = created_students[:18]

        for idx, student in enumerate(students_with_attendance):
            profile = profiles[idx]
            att_profile = ATTENDANCE_PROFILES.get(profile, ATTENDANCE_PROFILES["average"])
            enrollments = student_enrollments.get(student.id, [])

            for enrollment, _ in enrollments:
                sessions = list(enrollment.course.sessions.order_by("scheduled_at"))

                # Mark attendance for 60-100% of sessions
                pct = random.uniform(0.6, 1.0)
                sessions_to_mark = sessions[:int(len(sessions) * pct)]

                consecutive_absent = 0

                for session in sessions_to_mark:
                    status = weighted_choice(att_profile)

                    if status == "absent":
                        consecutive_absent += 1
                    else:
                        consecutive_absent = 0

                    att, created = Attendance.objects.get_or_create(
                        session=session,
                        enrollment=enrollment,
                        defaults={
                            "status": status,
                            "consecutive_absences": consecutive_absent,
                        }
                    )
                    if created:
                        attendance_count += 1

        self.stdout.write(self.style.SUCCESS(f"{attendance_count} attendance records created"))

        # ── Summary ────────────────────────────────────────────
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(self.style.SUCCESS("  SEED COMPLETE"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(f"  Students:    {len(created_students)}")
        self.stdout.write(f"  Enrollments: {enrollment_count}")
        self.stdout.write(f"  Grades:      {grade_count}")
        self.stdout.write(f"  Attendance:  {attendance_count}")
        self.stdout.write(f"  Courses:     {len(courses)} (each with 8 sessions)")
        self.stdout.write(self.style.SUCCESS("=" * 50))
