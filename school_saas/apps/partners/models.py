# ── apps/partners/models.py ────────────────────────────────
import uuid

from django.db import models


class PartnerType(models.TextChoices):
    COMPANY = 'company', 'Company'
    INSTITUTION = 'institution', 'Institution'
    NGO = 'ngo', 'NGO'
    OTHER = 'other', 'Other'


class Partner(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=30, choices=PartnerType.choices)
    contact_person = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    contract_file = models.FileField(
        upload_to='partners/contracts/', blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Partner'
        verbose_name_plural = 'Partners'

    def __str__(self):
        return self.name
