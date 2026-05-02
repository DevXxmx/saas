# ── apps/accounts/serializers.py ────────────────────────────
import re

from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser, Staff, Teacher

PHONE_REGEX = re.compile(r'^\+?[0-9\s\-]{7,20}$')
PASSWORD_REGEX_UPPER = re.compile(r'[A-Z]')
PASSWORD_REGEX_DIGIT = re.compile(r'[0-9]')
PASSWORD_REGEX_SPECIAL = re.compile(r'[^A-Za-z0-9]')


def validate_password_complexity(value):
    """Shared password complexity validation."""
    if not PASSWORD_REGEX_UPPER.search(value):
        raise serializers.ValidationError(
            'Password must contain at least one uppercase letter.'
        )
    if not PASSWORD_REGEX_DIGIT.search(value):
        raise serializers.ValidationError(
            'Password must contain at least one digit.'
        )
    if not PASSWORD_REGEX_SPECIAL.search(value):
        raise serializers.ValidationError(
            'Password must contain at least one special character.'
        )
    return value


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = ['id', 'department', 'position']


class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = [
            'id', 'specialization', 'contract_type', 'bio',
            'qualifications', 'can_teach_online',
        ]


class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'full_name', 'role', 'is_active']


class UserDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    teacher_profile = TeacherProfileSerializer(required=False)
    staff_profile = StaffSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'phone', 'photo',
            'role', 'is_active', 'is_staff', 'date_joined',
            'teacher_profile', 'staff_profile',
        ]
        read_only_fields = ['id', 'date_joined']

    def validate_first_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'First name must be at least 2 characters.'
            )
        return value.strip()

    def validate_last_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'Last name must be at least 2 characters.'
            )
        return value.strip()

    def validate_phone(self, value):
        if value and not PHONE_REGEX.match(value):
            raise serializers.ValidationError(
                'Invalid phone number format.'
            )
        return value

    def update(self, instance, validated_data):
        teacher_data = validated_data.pop('teacher_profile', None)
        instance = super().update(instance, validated_data)

        if teacher_data and hasattr(instance, 'teacher_profile'):
            profile = instance.teacher_profile
            for attr, value in teacher_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone',
            'photo', 'role', 'password',
        ]
        read_only_fields = ['id']

    def validate_first_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'First name must be at least 2 characters.'
            )
        return value.strip()

    def validate_last_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'Last name must be at least 2 characters.'
            )
        return value.strip()

    def validate_phone(self, value):
        if value and not PHONE_REGEX.match(value):
            raise serializers.ValidationError(
                'Invalid phone number format.'
            )
        return value

    def validate_password(self, value):
        return validate_password_complexity(value)

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser.objects.create_user(
            password=password, **validated_data
        )
        return user


class TeacherSerializer(serializers.ModelSerializer):
    user = UserListSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), source='user', write_only=True,
        required=False,
    )

    class Meta:
        model = Teacher
        fields = [
            'id', 'user', 'user_id', 'specialization', 'contract_type',
            'bio', 'qualifications', 'can_teach_online',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TeacherCreateWriteSerializer(serializers.Serializer):
    """Creates a User with role=teacher AND a Teacher profile in one request."""
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    specialization = serializers.CharField(max_length=200, required=False, allow_blank=True)
    contract_type = serializers.ChoiceField(choices=Teacher.CONTRACT_CHOICES)
    bio = serializers.CharField(required=False, allow_blank=True)
    qualifications = serializers.CharField(required=False, allow_blank=True)
    can_teach_online = serializers.BooleanField(default=False)

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_first_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'First name must be at least 2 characters.'
            )
        return value.strip()

    def validate_last_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                'Last name must be at least 2 characters.'
            )
        return value.strip()

    def validate_phone(self, value):
        if value and not PHONE_REGEX.match(value):
            raise serializers.ValidationError(
                'Invalid phone number format.'
            )
        return value

    def validate_password(self, value):
        return validate_password_complexity(value)

    def create(self, validated_data):
        from django.db import transaction
        teacher_fields = {
            'specialization': validated_data.pop('specialization', ''),
            'contract_type': validated_data.pop('contract_type'),
            'bio': validated_data.pop('bio', ''),
            'qualifications': validated_data.pop('qualifications', ''),
            'can_teach_online': validated_data.pop('can_teach_online', False),
        }
        password = validated_data.pop('password')
        with transaction.atomic():
            user = CustomUser.objects.create_user(
                role='teacher', password=password, **validated_data
            )
            teacher = Teacher.objects.create(user=user, **teacher_fields)
        return teacher

    def to_representation(self, instance):
        return TeacherSerializer(instance).data


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)
    user = UserDetailSerializer(read_only=True)

    def validate(self, attrs):
        from datetime import timedelta

        from django.utils import timezone as tz

        MAX_ATTEMPTS = 5
        LOCKOUT_WINDOW = timedelta(minutes=2)

        email = attrs.get('email')
        password = attrs.get('password')

        # Look up the user first to track failed attempts
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('Invalid email or password.')

        # Check if already locked
        if not user.is_active:
            raise serializers.ValidationError(
                'Your account has been locked due to too many failed login attempts. '
                'Please contact an administrator to reactivate it.'
            )

        # Reset counter if the lockout window has passed
        if (
            user.last_failed_login
            and tz.now() - user.last_failed_login > LOCKOUT_WINDOW
        ):
            user.failed_login_attempts = 0
            user.last_failed_login = None
            user.save(update_fields=['failed_login_attempts', 'last_failed_login'])

        # Attempt authentication
        authenticated_user = authenticate(username=email, password=password)

        if not authenticated_user:
            # Increment failed attempts
            user.failed_login_attempts += 1
            user.last_failed_login = tz.now()

            if user.failed_login_attempts >= MAX_ATTEMPTS:
                # Lock the account
                user.is_active = False
                user.save(update_fields=[
                    'failed_login_attempts', 'last_failed_login', 'is_active',
                ])
                # Write an explicit 'lock' entry in the audit log
                try:
                    from apps.audit.signals import log_account_locked
                    log_account_locked(user)
                except Exception:
                    pass
                raise serializers.ValidationError(
                    'Your account has been locked due to too many failed login attempts. '
                    'Please contact an administrator to reactivate it.'
                )

            remaining = MAX_ATTEMPTS - user.failed_login_attempts
            user.save(update_fields=['failed_login_attempts', 'last_failed_login'])
            raise serializers.ValidationError(
                f'Invalid email or password. '
                f'{remaining} attempt(s) remaining before account lockout.'
            )

        # Successful login — reset the counter
        if user.failed_login_attempts > 0:
            user.failed_login_attempts = 0
            user.last_failed_login = None
            user.save(update_fields=['failed_login_attempts', 'last_failed_login'])

        # Record the successful login in the audit log
        try:
            from apps.audit.signals import log_login
            log_login(authenticated_user)
        except Exception:
            pass

        refresh = RefreshToken.for_user(authenticated_user)
        return {
            'email': email,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserDetailSerializer(authenticated_user).data,
        }


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        return validate_password_complexity(value)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'New password and confirmation do not match.'}
            )
        if attrs['new_password'] == attrs['old_password']:
            raise serializers.ValidationError(
                {'new_password': 'New password must be different from old password.'}
            )
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
