export const PUBLIC_LOGOS_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const PUBLIC_LOGOS_TIMEOUT_MS = 45_000;
export const PERSISTENT_LOGOS_TIMEOUT_MS = 3_000;

export interface PublicLogoSnapshot<T> {
  data: T[];
  savedAt: number;
}

export const parsePublicLogoSnapshot = <T>(value: unknown, now = Date.now()): PublicLogoSnapshot<T> | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as { data?: unknown; savedAt?: unknown };
  if (!Array.isArray(candidate.data) || typeof candidate.savedAt !== 'number') return null;
  if (!Number.isFinite(candidate.savedAt) || candidate.savedAt > now) return null;
  if (now - candidate.savedAt >= PUBLIC_LOGOS_MAX_AGE_MS) return null;
  return { data: candidate.data as T[], savedAt: candidate.savedAt };
};

// Best-effort cache per warm isolate, never extended by failed requests.
export class PublicLogoCache<T> {
  private snapshot: PublicLogoSnapshot<T> | null = null;

  save(data: T[], now = Date.now()) {
    this.snapshot = { data, savedAt: now };
  }

  read(now = Date.now()) {
    if (!this.snapshot || now - this.snapshot.savedAt >= PUBLIC_LOGOS_MAX_AGE_MS) return null;
    return this.snapshot;
  }
}