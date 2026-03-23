/**
 * Global password reset cooldown with localStorage persistence.
 * Prevents 429 errors by sharing cooldown state across all components.
 */

const STORAGE_KEY = 'reset_password_cooldowns';

interface CooldownEntry {
  email: string;
  expiresAt: number; // timestamp ms
}

/**
 * Extracts wait time in seconds from a Supabase 429 error message
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
  return msg.includes('security purposes') || msg.includes('429') || msg.includes('rate_limit') || msg.includes('email rate limit');
}

/**
 * Default cooldown duration in seconds after a successful reset email send
 */
export const DEFAULT_COOLDOWN_SECONDS = 60;

function getStoredCooldowns(): CooldownEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries: CooldownEntry[] = JSON.parse(raw);
    // Clean expired entries
    const now = Date.now();
    return entries.filter(e => e.expiresAt > now);
  } catch {
    return [];
  }
}

function saveStoredCooldowns(entries: CooldownEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage not available
  }
}

/**
 * Get remaining cooldown seconds for a given email.
 * Returns 0 if no cooldown is active.
 */
export function getRemainingCooldown(email: string): number {
  const entries = getStoredCooldowns();
  const entry = entries.find(e => e.email.toLowerCase() === email.toLowerCase());
  if (!entry) return 0;
  const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

/**
 * Set a cooldown for a given email (persisted in localStorage).
 */
export function setCooldown(email: string, seconds: number) {
  const entries = getStoredCooldowns().filter(e => e.email.toLowerCase() !== email.toLowerCase());
  entries.push({ email: email.toLowerCase(), expiresAt: Date.now() + seconds * 1000 });
  saveStoredCooldowns(entries);
}

/**
 * Check if a given email is currently on cooldown.
 */
export function isOnCooldown(email: string): boolean {
  return getRemainingCooldown(email) > 0;
}
