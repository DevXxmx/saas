# ── apps/attendance/views.py ───────────────────────────────
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.models import CourseSession, Enrollment
from utils.permissions import IsAdminOrHR, IsTeacher

from .models import Attendance
from .serializers import AttendanceSerializer, BulkAttendanceSerializer


class BulkAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def check_permissions(self, request):
        super().check_permissions(request)
        # Only admins and teachers can submit attendance
        if request.user.role not in ('admin', 'teacher'):
            self.permission_denied(request, message='Only admins and teachers can submit attendance.')

    def post(self, request):
        serializer = BulkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = serializer.validated_data['session_id']
        records = serializer.validated_data['records']

        try:
            session = CourseSession.objects.select_related('course__teacher__user').get(
                id=session_id
            )
        except CourseSession.DoesNotExist:
            return Response(
                {'error': 'Session not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Verify teacher owns this course (admins bypass this check)
        if request.user.role != 'admin':
            if session.course.teacher and session.course.teacher.user != request.user:
                return Response(
                    {'error': 'You do not have permission for this course.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        created_records = []
        for record in records:
            enrollment_id = record['enrollment_id']
            att_status = record['status']

            try:
                enrollment = Enrollment.objects.get(id=enrollment_id)
            except Enrollment.DoesNotExist:
                continue

            attendance, _ = Attendance.objects.update_or_create(
                session=session,
                enrollment=enrollment,
                defaults={'status': att_status},
            )
            created_records.append(attendance)

        # Re-fetch from DB so the signal's queryset .update() on
        # consecutive_absences is reflected (it doesn't refresh the Python obj)
        record_pks = [a.pk for a in created_records]
        refreshed = list(
            Attendance.objects.filter(pk__in=record_pks)
            .select_related('enrollment__student', 'session__course')
            .order_by('enrollment__student__last_name')
        )
        result_serializer = AttendanceSerializer(refreshed, many=True)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


class SessionAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        # Teachers can only see attendance for their own courses
        try:
            session = CourseSession.objects.select_related('course__teacher__user').get(
                id=session_id
            )
        except CourseSession.DoesNotExist:
            return Response(
                {'error': 'Session not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.user.role == 'teacher':
            if not session.course.teacher or session.course.teacher.user != request.user:
                return Response(
                    {'error': 'You do not have permission for this course.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Get existing attendance records
        records = Attendance.objects.filter(
            session_id=session_id
        ).select_related('enrollment__student')
        attendance_data = AttendanceSerializer(records, many=True).data

        # Get all enrollments for this course so the frontend can show un-marked students
        enrollments = Enrollment.objects.filter(
            course=session.course, is_active=True
        ).select_related('student')
        enrollments_data = [
            {
                'id': str(e.id),
                'enrollment_id': str(e.id),
                'student_name': e.student.full_name,
                'student_email': e.student.email,
            }
            for e in enrollments
        ]

        return Response({
            'session': {
                'id': str(session.id),
                'course_title': session.course.title,
                'scheduled_at': session.scheduled_at.isoformat(),
                'duration_minutes': session.duration_minutes,
            },
            'enrollments': enrollments_data,
            'attendance': attendance_data,
        })


class StudentAttendanceView(APIView):
    permission_classes = [IsAdminOrHR]

    def get(self, request, student_id):
        records = Attendance.objects.filter(
            enrollment__student_id=student_id
        ).select_related('session__course', 'enrollment__student').order_by(
            '-session__scheduled_at'
        )
        serializer = AttendanceSerializer(records, many=True)
        return Response(serializer.data)
