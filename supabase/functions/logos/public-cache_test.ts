import { PublicLogoCache, PUBLIC_LOGOS_MAX_AGE_MS, PUBLIC_LOGOS_TIMEOUT_MS } from './public-cache.ts';

const equal = (actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('Unexpected cache result');
};

Deno.test('public logo snapshots expire within 24 hours', () => {
  const cache = new PublicLogoCache<{ id: string }>();
  cache.save([{ id: 'real-response' }], 100);
  equal(cache.read(100 + 24 * 60 * 60 * 1000 - 1)?.data, [{ id: 'real-response' }]);
  equal(cache.read(100 + 24 * 60 * 60 * 1000), null);
  equal(PUBLIC_LOGOS_MAX_AGE_MS, 86_400_000);
});

Deno.test('failed reads cannot renew the successful snapshot timestamp', () => {
  const cache = new PublicLogoCache<string>();
  equal(cache.read(100), null);
  cache.save(['loaded-logo'], 100);
  equal(cache.read(10_000)?.savedAt, 100);
  equal(cache.read(86_400_100), null);
});

Deno.test('a successful empty response replaces old logos', () => {
  const cache = new PublicLogoCache<string>();
  cache.save(['removed-logo'], 100);
  cache.save([], 200);
  equal(cache.read(300)?.data, []);
});

Deno.test('public upstream requests have a finite 45 second budget', () => {
  equal(PUBLIC_LOGOS_TIMEOUT_MS, 45_000);
});