# ── utils/permissions.py ───────────────────────────────────
from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrHR(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'hr')


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'teacher'


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role == 'admin'


class IsOwnerTeacher(BasePermission):
    """Teacher can only access their own courses."""

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'teacher') and obj.teacher:
            return obj.teacher.user == request.user
        return False
