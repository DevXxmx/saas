# ── config/settings/development.py ──────────────────────────
from .base import *  # noqa: F401,F403

DEBUG = True

INSTALLED_APPS += [
    'debug_toolbar',
]

MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')

INTERNAL_IPS = ['127.0.0.1']

# Local filesystem for media and static
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
