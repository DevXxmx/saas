// ── src/utils/queryHelpers.js ──────────────────────────
/**
 * Extract paginated list from DRF response data.
 * Handles both paginated { results: [...] } and plain array responses.
 */
export const extractList = (data) => data?.results || data || []

/**
 * Extract total count from DRF paginated response.
 */
export const extractCount = (data) => data?.count || 0
