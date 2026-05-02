# ── apps/accounts/views.py ─────────────────────────────────
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.courses.models import CourseSession
from apps.courses.serializers import CourseSessionSerializer
from utils.permissions import IsAdmin, IsAdminOrHR

from .models import CustomUser, Teacher
from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    TeacherSerializer,
    UserCreateSerializer,
    UserDetailSerializer,
    UserListSerializer,
)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            return Response({
                'access': str(token.access_token),
                'refresh': str(token),
            })
        except Exception:
            return Response(
                {'error': 'Invalid or expired refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'detail': 'Successfully logged out.'},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {'error': 'Invalid token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserDetailSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response(
            {'detail': 'Password changed successfully.'},
            status=status.HTTP_200_OK,
        )


class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    permission_classes = [IsAdmin]

    def get_permissions(self):
        # HR staff can read user profiles (needed for teacher detail pages)
        if self.action in ('list', 'retrieve'):
            return [IsAdminOrHR()]
        # All write/unlock actions remain admin-only
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        if self.action == 'create':
            return UserCreateSerializer
        return UserDetailSerializer

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response(
            {'detail': 'User deactivated.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='unlock')
    def unlock(self, request, pk=None):
        """Unlock a locked account: reset failed attempts and reactivate."""
        user = self.get_object()
        user.is_active = True
        user.failed_login_attempts = 0
        user.last_failed_login = None
        user.save(update_fields=['is_active', 'failed_login_attempts', 'last_failed_login'])
        # Record the unlock event in the audit log
        try:
            from apps.audit.signals import log_unlock
            log_unlock(target_user=user, unlocked_by=request.user)
        except Exception:
            pass
        return Response(
            {'detail': f'Account for {user.email} has been unlocked.'},
            status=status.HTTP_200_OK,
        )


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.select_related('user').all()
    permission_classes = [IsAdminOrHR]

    def get_serializer_class(self):
        if self.action == 'create':
            from .serializers import TeacherCreateWriteSerializer
            return TeacherCreateWriteSerializer
        return TeacherSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAdminOrHR()]


class TeacherScheduleView(APIView):
    permission_classes = [IsAdminOrHR]

    def get(self, request, pk):
        try:
            teacher = Teacher.objects.get(pk=pk)
        except Teacher.DoesNotExist:
            return Response(
                {'error': 'Teacher not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        sessions = CourseSession.objects.filter(
            course__teacher=teacher,
            scheduled_at__gte=timezone.now(),
        ).select_related('course').order_by('scheduled_at')
        serializer = CourseSessionSerializer(sessions, many=True)
        return Response(serializer.data)
