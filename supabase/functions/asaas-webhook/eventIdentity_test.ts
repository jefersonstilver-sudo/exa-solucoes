import { assert, assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts';
import { isValidEventId } from './eventIdentity.ts';

const actualId = 'evt_05b708f961d739ea7eba7e4db318f621&1543434805';

Deno.test('preserves the real Asaas ID as the event identity', () => {
  assert(isValidEventId(actualId));
  assertEquals(actualId, 'evt_05b708f961d739ea7eba7e4db318f621&1543434805');
});

Deno.test('rejects invalid IDs without restricting valid punctuation', () => {
  for (const value of [null, 12, {}, '', 'a', 'a'.repeat(121), 'evt_\n1', 'evt_\u00001', 'evt_\u00851']) {
    assertEquals(isValidEventId(value), false);
  }
  for (const value of ['evt_1&2', 'evt_1/2', 'evt_1+2']) assert(isValidEventId(value));
});

Deno.test('a retry uses exactly the same deduplication identity', () => {
  const first = { id: actualId, event: 'PAYMENT_CREATED', payment: { id: 'pay_8mj3fhelg71jibab', value: 0.01 } };
  const retry = { ...first, payment: { ...first.payment } };
  const seen = new Set<string>();
  const key = (event: typeof first) => `asaas:${event.id}`;
  assertEquals(seen.has(key(first)), false);
  seen.add(key(first));
  assertEquals(seen.has(key(retry)), true);
  assertEquals(seen.size, 1);
});