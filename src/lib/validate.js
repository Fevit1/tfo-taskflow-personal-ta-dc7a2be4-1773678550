/**
 * Shared Validation Utilities
 * ----------------------------
 * Small, pure functions used across API route handlers.
 * Keeping them here avoids duplication and makes them easy to test.
 */

/**
 * RFC 4122 UUID v4 regex.
 * Used to validate task IDs before executing any database query.
 * Prevents malformed or injection-attempting strings from reaching Supabase.
 *
 * @type {RegExp}
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns true if the given string is a valid UUID (any version 1–5).
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isValidUUID(value) {
  if (typeof value !== 'string') return false;
  return UUID_REGEX.test(value);
}

/**
 * Returns true if the given string is a valid ISO date (YYYY-MM-DD).
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isValidDate(value) {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}
