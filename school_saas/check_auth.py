import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
import django
django.setup()

from apps.accounts.models import CustomUser
from django.contrib.auth import authenticate

for u in CustomUser.objects.all():
    print(f"User: {u.email}")
    print(f"  role: {u.role}, active: {u.is_active}, is_staff: {u.is_staff}")
    print(f"  has_usable_password: {u.has_usable_password()}")
    print(f"  password hash prefix: {u.password[:30]}...")
    
    # Try authenticate with this email
    result = authenticate(username=u.email, password='admin123')
    print(f"  authenticate(username=email, password='admin123'): {result}")
    result2 = authenticate(email=u.email, password='admin123')
    print(f"  authenticate(email=email, password='admin123'): {result2}")
    
    # Direct password checks
    for pwd in ['admin123', 'admin', 'password', '12345678', 'meriem123']:
        ok = u.check_password(pwd)
        if ok:
            print(f"  *** check_password('{pwd}'): TRUE ***")
    print()

print("USERNAME_FIELD:", CustomUser.USERNAME_FIELD)
print("Django auth backends:", django.conf.settings.AUTHENTICATION_BACKENDS)
