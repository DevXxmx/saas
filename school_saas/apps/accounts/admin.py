# ── apps/accounts/admin.py ─────────────────────────────────
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import CustomUser, Staff, Teacher


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'is_active', 'failed_login_attempts']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    actions = ['unlock_accounts']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone', 'photo')}),
        ('Role', {'fields': ('role',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Security', {'fields': ('failed_login_attempts', 'last_failed_login')}),
    )
    readonly_fields = ['failed_login_attempts', 'last_failed_login']
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )

    @admin.action(description='Unlock selected accounts (reset failed attempts and reactivate)')
    def unlock_accounts(self, request, queryset):
        updated = queryset.update(
            is_active=True,
            failed_login_attempts=0,
            last_failed_login=None,
        )
        self.message_user(request, f'{updated} account(s) unlocked successfully.')


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ['user', 'specialization', 'contract_type', 'can_teach_online']
    list_filter = ['contract_type', 'can_teach_online']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'specialization']


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ['user', 'department', 'position']
    list_filter = ['department']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'department']
