import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { isAsaasPaid, requireAsaasPaymentId } from '../src/services/asaasPaymentRules.ts';

test('RECEIVED confirma pagamento Asaas', () => assert.equal(isAsaasPaid('RECEIVED'), true));
test('CONFIRMED confirma pagamento Asaas', () => assert.equal(isAsaasPaid('CONFIRMED'), true));
test('outros estados não confirmam pagamento', () => {
  for (const status of ['PENDING', 'OVERDUE', 'DELETED', 'approved', 'ativo', undefined]) assert.equal(isAsaasPaid(status), false);
});
test('consulta exige identificador oficial, não referência aproximada', () => {
  assert.equal(requireAsaasPaymentId('pay_8mj3fhelg71jibab'), 'pay_8mj3fhelg71jibab');
  assert.throws(() => requireAsaasPaymentId('123456'));
});