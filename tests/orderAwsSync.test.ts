import { expect, test } from 'bun:test';
import { collectOrderBuildings, eligibleForOrderSync, orderSyncOutcome } from '../supabase/functions/_shared/order-sync-policy';

test('reactivated active orders with a renewed end date are eligible', () => {
  expect(eligibleForOrderSync({ status: 'ativo', data_fim: '2027-10-16' }, '2026-10-17')).toBe(true);
});
test('expired and blocked orders must not be resent as active', () => {
  expect(eligibleForOrderSync({ status: 'ativo', data_fim: '2026-06-05' }, '2026-10-17')).toBe(false);
  expect(eligibleForOrderSync({ status: 'bloqueado', data_fim: '2099-12-31' }, '2026-10-17')).toBe(false);
});
test('master resends cover all own and child buildings without duplicates', () => {
  expect(collectOrderBuildings(['predio-1'], [{ lista_predios: ['predio-1', 'predio-2'] }])).toEqual(['predio-1', 'predio-2']);
});
test('missing approved video uploads must not be reported as success', () => {
  expect(orderSyncOutcome(3, 2, {})).toBe('error');
});
test('queued AWS work is pending, not completed', () => {
  expect(orderSyncOutcome(3, 3, { task_id: 'task-real' })).toBe('pending');
});