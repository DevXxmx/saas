# ── apps/communications/admin.py ───────────────────────────
from django.contrib import admin

from .models import EmailLog, Notification


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ['subject', 'trigger_type', 'status', 'sent_at', 'sent_by']
    list_filter = ['trigger_type', 'status']
    search_fields = ['subject', 'body']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'title', 'notif_type', 'is_read', 'created_at']
    list_filter = ['notif_type', 'is_read']
    search_fields = ['title', 'body']
