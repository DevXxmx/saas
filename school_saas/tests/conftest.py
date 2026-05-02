# ── tests/conftest.py ──────────────────────────────────────
import pytest
from rest_framework.test import APIClient

from tests.factories import CustomUserFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return CustomUserFactory(role='admin', is_staff=True)


@pytest.fixture
def hr_user(db):
    return CustomUserFactory(role='hr')


@pytest.fixture
def teacher_user(db):
    return CustomUserFactory(role='teacher')


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def teacher_client(api_client, teacher_user):
    api_client.force_authenticate(user=teacher_user)
    return api_client


@pytest.fixture
def hr_client(api_client, hr_user):
    api_client.force_authenticate(user=hr_user)
    return api_client
