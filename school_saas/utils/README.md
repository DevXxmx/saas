<!-- ── utils/README.md ─────────────────────────────────────── -->

# Utilities

## Files

### `email.py`

**`render_email(template_name, context) → str`**
Renders an HTML email template using Django's `render_to_string`. Automatically injects `school_name`, `school_address`, `school_phone`, and `school_email` into the context from settings. All templates extend `base_email.html`.

**`send_email(to, subject, html_content)`**
Sends an email via the Mailjet Send API v3.1 using `MAILJET_API_KEY` and `MAILJET_API_SECRET` from settings. Supports both single and list recipients. Raises an exception on non-success response, which enables Celery retry logic. Called by all Celery email tasks — never called directly from views.

### `pagination.py`

**`StandardPagination`** (extends `PageNumberPagination`)
- `page_size = 20`
- `page_size_query_param = 'page_size'`
- `max_page_size = 100`
- Response envelope: `{ count, next, previous, results }`

Applied globally via `DEFAULT_PAGINATION_CLASS` in settings.

### `filters.py`

Central re-exports of all app filter classes for convenience. Each app defines its own `FilterSet` in `apps/{app}/filters.py`. This module provides a single import point.

### `permissions.py`

| Class | Rule |
|---|---|
| `IsAdmin` | `role == 'admin'` |
| `IsAdminOrHR` | `role in ('admin', 'hr')` |
| `IsTeacher` | `role == 'teacher'` |
| `IsAdminOrReadOnly` | Admin for writes, any authenticated user for reads |
| `IsOwnerTeacher` | Teacher is the owner of the object's course |

All classes inherit `rest_framework.permissions.BasePermission`.

Import in any view with:

```python
from utils.permissions import IsAdmin, IsAdminOrHR
```
