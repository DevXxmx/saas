# ── apps/partners/urls.py ──────────────────────────────────
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PartnerViewSet

router = DefaultRouter()
router.register(r'partners', PartnerViewSet, basename='partners')

urlpatterns = [
    path('', include(router.urls)),
]
