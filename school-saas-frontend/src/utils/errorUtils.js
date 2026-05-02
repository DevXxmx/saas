// ── src/utils/errorUtils.js ──────────────────────────────

/**
 * Extracts a human-readable error message from a DRF error response.
 * DRF may return:
 *   - { "detail": "string" }
 *   - { "field_name": ["error1", "error2"] }
 *   - { "non_field_errors": ["error1"] }
 *   - A plain string
 */
export function extractErrorMessage(err, fallback = 'An error occurred') {
  const data = err?.response?.data

  if (!data) return err?.message || fallback

  // String response
  if (typeof data === 'string') return data

  // DRF standard detail field
  if (data.detail) {
    return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
  }

  // Non-field errors
  if (data.non_field_errors) {
    return Array.isArray(data.non_field_errors)
      ? data.non_field_errors.join('. ')
      : String(data.non_field_errors)
  }

  // Field-level errors: { "email": ["This field is required."] }
  if (typeof data === 'object') {
    const messages = []
    for (const [field, errors] of Object.entries(data)) {
      const fieldErrors = Array.isArray(errors) ? errors.join(', ') : String(errors)
      messages.push(`${field}: ${fieldErrors}`)
    }
    if (messages.length > 0) return messages.join('. ')
  }

  return fallback
}
