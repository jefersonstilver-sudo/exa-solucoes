export const PUBLIC_LOGOS_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const PUBLIC_LOGOS_TIMEOUT_MS = 45_000;

// Best-effort cache per warm isolate, never extended by failed requests.
export class PublicLogoCache<T> {
  private snapshot: { data: T[]; savedAt: number } | null = null;

  save(data: T[], now = Date.now()) {
    this.snapshot = { data, savedAt: now };
  }

  read(now = Date.now()) {
    if (!this.snapshot || now - this.snapshot.savedAt >= PUBLIC_LOGOS_MAX_AGE_MS) return null;
    return this.snapshot;
  }
}