import { test, expect } from 'bun:test';
import { transactionRecoveryManager } from '../src/utils/transactionRecoveryManager';

test('automatic recovery cannot approve or credit orders', async () => {
  const result = await transactionRecoveryManager.autoRecoverUserTransactions('user-id');
  expect(result.success).toBe(false);
  expect(result.recoveredTransactions).toBe(0);
  expect(result.totalValue).toBe(0);
});