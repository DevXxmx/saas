import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
import django
django.setup()

from apps.accounts.models import CustomUser

email = 'test@school.com'
password = 'Test@12345'

# Delete existing test user if any
CustomUser.objects.filter(email=email).delete()

user = CustomUser.objects.create_user(
    email=email,
    first_name='Test',
    last_name='Admin',
    role='admin',
    password=password,
    is_staff=True,
    is_active=True,
)

# Verify it works
from django.contrib.auth import authenticate
result = authenticate(username=email, password=password)
print(f"Created user: {user.email} (role={user.role})")
print(f"authenticate() check: {'SUCCESS' if result else 'FAILED'}")
print(f"\nLogin credentials:")
print(f"  Email:    {email}")
print(f"  Password: {password}")
