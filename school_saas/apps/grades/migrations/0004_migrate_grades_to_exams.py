# ── apps/grades/migrations/0004_migrate_grades_to_exams.py ──
from django.db import migrations


def forwards(apps, schema_editor):
    """
    For each unique (course, module_name, exam_type) combination in existing
    Grade records, create an Exam and link the Grade rows to it.
    """
    Grade = apps.get_model('grades', 'Grade')
    Exam = apps.get_model('grades', 'Exam')

    # Collect unique combos
    seen = {}
    for grade in Grade.objects.select_related('enrollment__course').all():
        course = grade.enrollment.course
        key = (str(course.id), grade.module_name, grade.exam_type)
        if key not in seen:
            exam = Exam.objects.create(
                course=course,
                title=f"{grade.module_name} ({grade.exam_type})",
                exam_type=grade.exam_type or 'quiz',
                module_name=grade.module_name or 'General',
                created_by=None,
            )
            seen[key] = exam
        grade.exam = seen[key]
        grade.save(update_fields=['exam'])


def backwards(apps, schema_editor):
    """Copy exam fields back to grade legacy fields and unlink."""
    Grade = apps.get_model('grades', 'Grade')
    for grade in Grade.objects.select_related('exam').filter(exam__isnull=False):
        grade.module_name = grade.exam.module_name
        grade.exam_type = grade.exam.exam_type
        grade.exam = None
        grade.save(update_fields=['module_name', 'exam_type', 'exam'])


class Migration(migrations.Migration):

    dependencies = [
        ('grades', '0003_add_exam_model'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
