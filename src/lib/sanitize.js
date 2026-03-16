/**
 * Input Sanitization
 * ------------------
 * Strips characters and patterns that could enable stored XSS attacks.
 *
 * This is a lightweight server-side sanitizer designed for plain-text fields
 * (task titles, descriptions, categories). It does NOT attempt to allow safe
 * HTML — all user input is treated as plain text and stored as-is after
 * stripping HTML tags.
 *
 * A heavier library like DOMPurify (browser) or sanitize-html (server) can
 * replace this if rich-text support is added in future.
 */

/**
 * Sanitize a plain-text string:
 * 1. Strip all HTML tags (< ... >)
 * 2. Decode common HTML entities to their plain-text equivalents
 *    (prevents double-encoding issues)
 * 3. Trim surrounding whitespace
 *
 * @param {string} input
 * @returns {string}
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') return '';

  return input
    // Strip HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities to plain text equivalents
    .replace(/&amp;/gi,  '&')
    .replace(/&lt;/gi,   '<')
    .replace(/&gt;/gi,   '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&nbsp;/gi, ' ')
    // Collapse multiple spaces/newlines left by stripped tags (preserve intentional newlines)
    .replace(/ {2,}/g, ' ')
    .trim();
}
