# ── management/commands/seed_data.py ────────────────────────
"""
Seed the database with sample data:
  - 20 Students
  - 4  Teachers (each with a CustomUser account, role='teacher')
  - 6  Courses  (assigned to teachers)
"""
import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import CustomUser, Teacher
from apps.students.models import Student
from apps.courses.models import Course


class Command(BaseCommand):
    help = "Seed the database with 20 students, 4 teachers, and 6 courses."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("[SEED] Seeding database..."))

        # ─── Teachers ──────────────────────────────────────
        teachers_data = [
            {
                "first_name": "Ahmed",
                "last_name": "Benmoussa",
                "email": "ahmed.benmoussa@school.com",
                "phone": "+212 6 12 34 56 78",
                "specialization": "Mathematics & Statistics",
                "contract_type": "full_time",
                "bio": "PhD in Applied Mathematics with 12 years of teaching experience.",
                "qualifications": "PhD Mathematics - University of Rabat",
                "can_teach_online": True,
            },
            {
                "first_name": "Fatima",
                "last_name": "Zahra",
                "email": "fatima.zahra@school.com",
                "phone": "+212 6 23 45 67 89",
                "specialization": "Computer Science & Programming",
                "contract_type": "full_time",
                "bio": "Senior software engineer turned educator. Expert in Python, Java, and web development.",
                "qualifications": "MSc Computer Science - ENSIAS",
                "can_teach_online": True,
            },
            {
                "first_name": "Youssef",
                "last_name": "El Idrissi",
                "email": "youssef.elidrissi@school.com",
                "phone": "+212 6 34 56 78 90",
                "specialization": "Physics & Engineering",
                "contract_type": "part_time",
                "bio": "Mechanical engineer with a passion for teaching physics fundamentals.",
                "qualifications": "MEng Mechanical Engineering - EMI",
                "can_teach_online": False,
            },
            {
                "first_name": "Sara",
                "last_name": "Bennani",
                "email": "sara.bennani@school.com",
                "phone": "+212 6 45 67 89 01",
                "specialization": "English & Communication",
                "contract_type": "freelance",
                "bio": "Certified TESOL instructor with international teaching experience.",
                "qualifications": "MA English Literature - University of London, TESOL Certificate",
                "can_teach_online": True,
            },
        ]

        teachers = []
        for td in teachers_data:
            user, created = CustomUser.objects.get_or_create(
                email=td["email"],
                defaults={
                    "first_name": td["first_name"],
                    "last_name": td["last_name"],
                    "phone": td["phone"],
                    "role": "teacher",
                },
            )
            if created:
                user.set_password("Teacher@123")
                user.save()

            teacher, _ = Teacher.objects.get_or_create(
                user=user,
                defaults={
                    "specialization": td["specialization"],
                    "contract_type": td["contract_type"],
                    "bio": td["bio"],
                    "qualifications": td["qualifications"],
                    "can_teach_online": td["can_teach_online"],
                },
            )
            teachers.append(teacher)
            tag = "[+] created" if created else "[=] exists"
            self.stdout.write(f"  Teacher {td['first_name']} {td['last_name']} - {tag}")

        self.stdout.write(self.style.SUCCESS(f"  -> {len(teachers)} teachers ready.\n"))

        # ─── Students ──────────────────────────────────────
        students_data = [
            ("Amine", "Rachidi", "amine.rachidi@student.com", "2003-05-14", "AB123456"),
            ("Khadija", "Ouazzani", "khadija.ouazzani@student.com", "2004-02-28", "CD234567"),
            ("Omar", "Tazi", "omar.tazi@student.com", "2003-11-05", "EF345678"),
            ("Salma", "Berrada", "salma.berrada@student.com", "2004-07-19", "GH456789"),
            ("Hamza", "Alami", "hamza.alami@student.com", "2003-09-10", "IJ567890"),
            ("Nour", "Fassi", "nour.fassi@student.com", "2004-01-22", "KL678901"),
            ("Reda", "Chraibi", "reda.chraibi@student.com", "2003-03-17", "MN789012"),
            ("Imane", "Hajji", "imane.hajji@student.com", "2004-06-03", "OP890123"),
            ("Mehdi", "Kettani", "mehdi.kettani@student.com", "2003-12-25", "QR901234"),
            ("Zineb", "Lahlou", "zineb.lahlou@student.com", "2004-04-11", "ST012345"),
            ("Yassine", "Benkirane", "yassine.benkirane@student.com", "2003-08-30", "UV123457"),
            ("Hajar", "Sqalli", "hajar.sqalli@student.com", "2004-10-08", "WX234568"),
            ("Anass", "Derouich", "anass.derouich@student.com", "2003-01-15", "YZ345679"),
            ("Maryam", "Filali", "maryam.filali@student.com", "2004-09-20", "AB456780"),
            ("Taha", "Guedira", "taha.guedira@student.com", "2003-07-06", "CD567891"),
            ("Houda", "Sbai", "houda.sbai@student.com", "2004-03-12", "EF678902"),
            ("Othmane", "Moussaoui", "othmane.moussaoui@student.com", "2003-10-29", "GH789013"),
            ("Rim", "El Amrani", "rim.elamrani@student.com", "2004-05-18", "IJ890124"),
            ("Ayoub", "Benjelloun", "ayoub.benjelloun@student.com", "2003-06-22", "KL901235"),
            ("Lina", "Idrissi", "lina.idrissi@student.com", "2004-11-30", "MN012346"),
        ]

        students = []
        for first, last, email, dob, nid in students_data:
            student, created = Student.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first,
                    "last_name": last,
                    "date_of_birth": date.fromisoformat(dob),
                    "national_id": nid,
                    "phone": f"+212 6 {random.randint(10,99)} {random.randint(10,99)} {random.randint(10,99)} {random.randint(10,99)}",
                    "year_enrolled": random.choice([2023, 2024, 2025]),
                    "status": "active",
                },
            )
            students.append(student)
            tag = "[+] created" if created else "[=] exists"
            self.stdout.write(f"  Student {first} {last} - {tag}")

        self.stdout.write(self.style.SUCCESS(f"  -> {len(students)} students ready.\n"))

        # ─── Courses ───────────────────────────────────────
        today = date.today()
        courses_data = [
            {
                "title": "Advanced Calculus",
                "description": "Deep dive into differential equations, multivariable calculus, and real analysis.",
                "type": "offline",
                "status": "active",
                "level": "Advanced",
                "capacity": 30,
                "start_date": today - timedelta(days=30),
                "end_date": today + timedelta(days=60),
                "location": "Room A-201",
                "teacher": teachers[0],
            },
            {
                "title": "Full-Stack Web Development",
                "description": "Build modern web applications with React, Django, and PostgreSQL.",
                "type": "online",
                "status": "active",
                "level": "Intermediate",
                "capacity": 25,
                "start_date": today - timedelta(days=15),
                "end_date": today + timedelta(days=75),
                "location": "",
                "virtual_link": "https://meet.school.com/webdev-2026",
                "teacher": teachers[1],
            },
            {
                "title": "Classical Mechanics",
                "description": "Newtonian mechanics, Lagrangian & Hamiltonian formulations for engineering students.",
                "type": "offline",
                "status": "active",
                "level": "Beginner",
                "capacity": 35,
                "start_date": today - timedelta(days=10),
                "end_date": today + timedelta(days=80),
                "location": "Lab B-105",
                "teacher": teachers[2],
            },
            {
                "title": "Business English Communication",
                "description": "Professional English for presentations, emails, and negotiations.",
                "type": "online",
                "status": "active",
                "level": "Intermediate",
                "capacity": 20,
                "start_date": today + timedelta(days=5),
                "end_date": today + timedelta(days=95),
                "location": "",
                "virtual_link": "https://meet.school.com/biz-english",
                "teacher": teachers[3],
            },
            {
                "title": "Data Structures & Algorithms",
                "description": "Master core computer science concepts: trees, graphs, sorting, and dynamic programming.",
                "type": "offline",
                "status": "draft",
                "level": "Advanced",
                "capacity": 28,
                "start_date": today + timedelta(days=30),
                "end_date": today + timedelta(days=120),
                "location": "Room C-310",
                "teacher": teachers[1],
            },
            {
                "title": "Probability & Statistics",
                "description": "Fundamentals of probability theory, statistical inference, and data analysis.",
                "type": "online",
                "status": "active",
                "level": "Beginner",
                "capacity": 40,
                "start_date": today - timedelta(days=5),
                "end_date": today + timedelta(days=85),
                "location": "",
                "virtual_link": "https://meet.school.com/stats-2026",
                "teacher": teachers[0],
            },
        ]

        courses = []
        for cd in courses_data:
            teacher = cd.pop("teacher")
            virtual_link = cd.pop("virtual_link", "")
            course, created = Course.objects.get_or_create(
                title=cd["title"],
                defaults={
                    **cd,
                    "teacher": teacher,
                    "virtual_link": virtual_link,
                },
            )
            courses.append(course)
            tag = "[+] created" if created else "[=] exists"
            self.stdout.write(f"  Course \"{cd['title']}\" - {tag}")

        self.stdout.write(self.style.SUCCESS(f"  -> {len(courses)} courses ready.\n"))

        # ─── Summary ──────────────────────────────────────
        self.stdout.write(self.style.SUCCESS(
            "Seeding complete!\n"
            f"   Students : {Student.objects.count()}\n"
            f"   Teachers : {Teacher.objects.count()}\n"
            f"   Courses  : {Course.objects.count()}"
        ))
