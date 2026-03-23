/**
 * Utility for password reset cooldown and 429 error handling
 */

/**
 * Extracts wait time in seconds from a Supabase 429 error message
 * e.g. "For security purposes, you can only request this after 31 seconds."
 */
export function extractWaitSeconds(errorMessage: string): number | null {
  const match = errorMessage.match(/after\s+(\d+)\s+second/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Checks if an error is a 429 rate limit error
 */
export function isRateLimitError(error: any): boolean {
  const msg = error?.message || error?.error_description || String(error);
  return msg.includes('security purposes') || msg.includes('429') || msg.includes('rate_limit');
}

/**
 * Default cooldown duration in seconds after a successful reset email send
 */
export const DEFAULT_COOLDOWN_SECONDS = 60;
