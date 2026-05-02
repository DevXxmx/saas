# ── tests/test_auth.py ─────────────────────────────────────
import pytest
from django.urls import reverse
from rest_framework import status

from tests.factories import CustomUserFactory


@pytest.mark.django_db
class TestAuth:
    def test_login_success(self, api_client):
        user = CustomUserFactory(role='admin')
        url = reverse('auth-login')
        response = api_client.post(url, {
            'email': user.email,
            'password': 'TestPass123!',
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['user']['email'] == user.email

    def test_login_wrong_password(self, api_client):
        user = CustomUserFactory(role='admin')
        url = reverse('auth-login')
        response = api_client.post(url, {
            'email': user.email,
            'password': 'WrongPassword',
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_token_refresh(self, api_client):
        user = CustomUserFactory(role='admin')
        # Login first
        login_url = reverse('auth-login')
        login_response = api_client.post(login_url, {
            'email': user.email,
            'password': 'TestPass123!',
        })
        refresh_token = login_response.data['refresh']

        # Refresh
        refresh_url = reverse('auth-refresh')
        response = api_client.post(refresh_url, {'refresh': refresh_token})
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data

    def test_change_password(self, api_client):
        user = CustomUserFactory(role='admin')
        api_client.force_authenticate(user=user)
        url = reverse('auth-change-password')
        response = api_client.post(url, {
            'old_password': 'TestPass123!',
            'new_password': 'NewSecurePass456!',
            'confirm_password': 'NewSecurePass456!',
        })
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.check_password('NewSecurePass456!')

    def test_change_password_wrong_old(self, api_client):
        user = CustomUserFactory(role='admin')
        api_client.force_authenticate(user=user)
        url = reverse('auth-change-password')
        response = api_client.post(url, {
            'old_password': 'WrongOldPass',
            'new_password': 'NewSecurePass456!',
            'confirm_password': 'NewSecurePass456!',
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
