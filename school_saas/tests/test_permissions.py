# ── tests/test_permissions.py ──────────────────────────────
import pytest
from django.urls import reverse
from rest_framework import status

from tests.factories import CustomUserFactory


@pytest.mark.django_db
class TestRoleEnforcement:
    def test_admin_only_endpoint_returns_403_for_teacher(self, teacher_client):
        """Teacher cannot access admin-only user list endpoint."""
        url = reverse('users-list')
        response = teacher_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_access_user_list(self, admin_client):
        """Admin can access user list endpoint."""
        url = reverse('users-list')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_teacher_cannot_create_user(self, teacher_client):
        url = reverse('users-list')
        response = teacher_client.post(url, {
            'email': 'new@test.com',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'admin',
            'password': 'TestPass123!',
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_access_protected(self, api_client):
        url = reverse('users-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
