# ── apps/audit/middleware.py ───────────────────────────────
import threading

_thread_local = threading.local()


def get_current_user():
    """
    Retrieve the current user from the request stored in thread-local storage.
    This reads request.user lazily, so DRF JWT auth has time to populate it
    before the audit signal reads it.
    """
    request = getattr(_thread_local, '_request', None)
    if request is None:
        return None
    user = getattr(request, 'user', None)
    if user is not None and getattr(user, 'is_authenticated', False):
        return user
    return None


def get_current_ip():
    """Retrieve the current IP address from thread-local storage."""
    return getattr(_thread_local, 'ip_address', None)


class AuditMiddleware:
    """
    Middleware that stores the request and IP address in thread-local storage
    so that the audit signal can access them without passing request around.

    IMPORTANT: With JWT (Simple JWT), request.user is only populated by DRF's
    authentication backend DURING view execution, not at middleware level.
    We store a reference to the request object so get_current_user() can
    lazily read request.user at the time the signal fires.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Store a reference to the request so we can lazily read .user
        _thread_local._request = request
        _thread_local.ip_address = self._get_client_ip(request)
        response = self.get_response(request)
        # Clean up
        _thread_local._request = None
        _thread_local.ip_address = None
        return response

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
