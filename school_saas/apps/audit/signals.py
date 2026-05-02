# ── apps/audit/signals.py ──────────────────────────────────
import logging

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .middleware import get_current_ip, get_current_user
from .models import AuditLog

logger = logging.getLogger(__name__)

# Fields to exclude from change tracking
EXCLUDED_FIELDS = {
    '_state', '_django_version', 'password', 'updated_at',
    'consecutive_absences',  # computed field – tracked by its own signal
}


def _get_changes(instance, created):
    """Build a dict of field changes for the instance."""
    changes = {}
    for field in instance._meta.concrete_fields:
        name = field.attname
        if name not in EXCLUDED_FIELDS:
            val = getattr(instance, name, None)
            if created:
                changes[name] = {'new': str(val) if val is not None else None}
            else:
                changes[name] = {'value': str(val) if val is not None else None}
    return changes if changes else None


def _create_audit_log(action, sender, instance):
    """Create an AuditLog entry for the given action."""
    # Avoid recursion: don't audit AuditLog itself
    if sender.__name__ == 'AuditLog':
        return

    user = get_current_user()
    if user and not getattr(user, 'is_authenticated', False):
        user = None

    ip_address = get_current_ip()

    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            model_affected=sender.__name__,
            object_id=str(instance.pk),
            object_repr=str(instance)[:200],
            changes=_get_changes(instance, action == 'create') if action != 'delete' else None,
            ip_address=ip_address,
        )
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")


def log_account_locked(user):
    """
    Create an explicit 'lock' audit entry when an account is locked due
    to brute-force protection.  Called from the login serializer.
    """
    try:
        AuditLog.objects.create(
            user=None,           # no authenticated user during a failed login
            action='lock',
            model_affected='CustomUser',
            object_id=str(user.pk),
            object_repr=str(user)[:200],
            changes={
                'reason': 'Too many failed login attempts',
                'email': user.email,
            },
            ip_address=get_current_ip(),
        )
    except Exception as e:
        logger.error(f"Failed to create account-lock audit log: {e}")


def log_login(user):
    """
    Create an explicit 'login' audit entry on a successful authentication.
    Called from the login serializer after credentials are verified.
    """
    try:
        AuditLog.objects.create(
            user=user,
            action='login',
            model_affected='CustomUser',
            object_id=str(user.pk),
            object_repr=str(user)[:200],
            changes={'email': user.email, 'role': user.role},
            ip_address=get_current_ip(),
        )
    except Exception as e:
        logger.error(f"Failed to create login audit log: {e}")


def log_unlock(target_user, unlocked_by=None):
    """
    Create an explicit 'unlock' audit entry when an admin reactivates an account.
    Called from UserViewSet.unlock() action.
    """
    try:
        AuditLog.objects.create(
            user=unlocked_by,           # the admin who performed the unlock
            action='unlock',
            model_affected='CustomUser',
            object_id=str(target_user.pk),
            object_repr=str(target_user)[:200],
            changes={
                'email': target_user.email,
                'unlocked_by': unlocked_by.email if unlocked_by else 'system',
            },
            ip_address=get_current_ip(),
        )
    except Exception as e:
        logger.error(f"Failed to create unlock audit log: {e}")


def audit_post_save(sender, instance, created, **kwargs):
    action = 'create' if created else 'update'
    _create_audit_log(action, sender, instance)


def audit_post_delete(sender, instance, **kwargs):
    _create_audit_log('delete', sender, instance)


def register_audit_signals():
    """Connect audit signals to all audited models."""
    from apps.accounts.models import CustomUser, Teacher
    from apps.attendance.models import Attendance
    from apps.courses.models import Course, CourseSession, Enrollment
    from apps.grades.models import Exam, Grade
    from apps.partners.models import Partner
    from apps.resources.models import CourseResource
    from apps.students.models import Student

    audited_models = [
        CustomUser, Teacher, Student, Course, CourseSession,
        Enrollment, Attendance, Exam, Grade, Partner, CourseResource,
    ]

    for model in audited_models:
        post_save.connect(audit_post_save, sender=model, weak=False)
        post_delete.connect(audit_post_delete, sender=model, weak=False)


# Register when this module is imported
register_audit_signals()
