import { describe, expect, test } from 'bun:test';
import { applyCardOrder, moveCard } from './orderCardOrdering';

describe('order card positions', () => {
  test('moves a pressed card to the target position without losing orders', () => {
    expect(moveCard(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b']);
  });
  test('restores saved order and retains newly added orders', () => {
    expect(applyCardOrder([{ id: 'a' }, { id: 'b' }, { id: 'c' }], ['b', 'a']).map(x => x.id)).toEqual(['b', 'a', 'c']);
  });
  test('unknown target does not change order', () => {
    expect(moveCard(['a', 'b'], 'a', 'missing')).toEqual(['a', 'b']);
  });
});