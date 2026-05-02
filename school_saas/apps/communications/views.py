# ── apps/communications/views.py ───────────────────────────
import logging
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import CustomUser
from apps.partners.models import Partner
from apps.students.models import Student
from utils.permissions import IsAdmin

from .filters import EmailLogFilter
from .models import EmailLog, Notification, TriggerType
from .serializers import BulkEmailSerializer, EmailLogSerializer, NotificationSerializer

logger = logging.getLogger(__name__)


class BulkEmailView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = BulkEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        subject = serializer.validated_data['subject']
        body = serializer.validated_data['body']
        recipient_type = serializer.validated_data['recipient_type']
        recipient_ids = serializer.validated_data['recipient_ids']

        # Resolve recipient emails
        emails = []
        if recipient_type == 'students':
            students = Student.objects.filter(id__in=recipient_ids)
            emails = list(students.values_list('email', flat=True))
        elif recipient_type == 'teachers':
            users = CustomUser.objects.filter(
                id__in=recipient_ids, role='teacher'
            )
            emails = list(users.values_list('email', flat=True))
        elif recipient_type == 'partners':
            partners = Partner.objects.filter(id__in=recipient_ids)
            emails = list(partners.values_list('email', flat=True))
        elif recipient_type == 'custom':
            # recipient_ids are raw email addresses for custom type
            emails = list(recipient_ids)

        # Create email log — store resolved emails, not raw IDs
        log = EmailLog.objects.create(
            subject=subject,
            body=body,
            recipient_type=recipient_type,
            recipient_ids=emails,
            trigger_type=TriggerType.BULK,
            sent_by=request.user,
        )

        # Wrap plain-text body in HTML for email clients
        html_body = self._wrap_body_html(body)

        # Queue task (or send synchronously if Celery/Redis unavailable)
        try:
            from tasks.email_tasks import send_bulk_email
            send_bulk_email.delay(
                subject=subject,
                body=html_body,
                recipient_emails=emails,
                log_id=str(log.id),
            )
            return Response(
                {'detail': 'Emails queued for sending.', 'log_id': str(log.id)},
                status=status.HTTP_202_ACCEPTED,
            )
        except Exception as queue_exc:
            # Celery/Redis unavailable — send synchronously as fallback
            logger.warning(
                f"Celery unavailable ({queue_exc}), sending emails synchronously."
            )
            from utils.email import send_email

            failed = False
            for email_addr in emails:
                try:
                    send_email(
                        to=email_addr, subject=subject, html_content=html_body
                    )
                except Exception as send_exc:
                    logger.error(
                        f"Failed to send email to {email_addr}: {send_exc}"
                    )
                    failed = True

            log.status = 'failed' if failed else 'sent'
            if not failed:
                from django.utils import timezone
                log.sent_at = timezone.now()
            log.save(update_fields=['status', 'sent_at'])

            if failed:
                return Response(
                    {'error': 'Some emails failed to send.'},
                    status=status.HTTP_207_MULTI_STATUS,
                )
            return Response(
                {'detail': 'Emails sent successfully.', 'log_id': str(log.id)},
                status=status.HTTP_200_OK,
            )

    @staticmethod
    def _wrap_body_html(body_text):
        """Wrap plain-text body in minimal HTML for email clients."""
        from django.utils.html import escape
        escaped = escape(body_text)
        html_body = escaped.replace('\n', '<br>\n')
        return (
            '<!DOCTYPE html>'
            '<html><body style="font-family:Arial,sans-serif;'
            'line-height:1.6;color:#333;">'
            f'{html_body}'
            '</body></html>'
        )


class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EmailLog.objects.all()
    serializer_class = EmailLogSerializer
    permission_classes = [IsAdmin]
    filterset_class = EmailLogFilter


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)
        return Response(
            {'detail': 'All notifications marked as read.'},
            status=status.HTTP_200_OK,
        )
