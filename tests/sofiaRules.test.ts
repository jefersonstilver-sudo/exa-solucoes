import { describe, expect, test } from 'bun:test';
import { formatCouponDiscount } from '../src/types/coupon';
import { isSofiaChargePaid } from '../src/services/asaasPaymentRules';
import { splitFullName } from '../src/services/clientProfileService';

describe('cupom mensal_fixo', () => {
  test('EXA5MES mostra R$ 5,00 por mês', () => {
    expect(formatCouponDiscount({ tipo_desconto: 'mensal_fixo', desconto_percentual: 5 }).replace(/\s/g, ' ')).toBe('R$ 5,00 por mês');
  });
  test('percentual continua em %', () => {
    expect(formatCouponDiscount({ tipo_desconto: 'percentual', desconto_percentual: 10 })).toBe('10% OFF');
  });
});

describe('cobrança Sofia paga', () => {
  test('PAID sem paid_at não conta como pago', () => {
    expect(isSofiaChargePaid('PAID', null)).toBe(false);
  });
  test('PAID com paid_at conta como pago', () => {
    expect(isSofiaChargePaid('PAID', '2026-10-21T15:10:37Z')).toBe(true);
  });
  test('PENDING não conta', () => {
    expect(isSofiaChargePaid('PENDING', '2026-10-21')).toBe(false);
  });
});

describe('nome do cliente', () => {
  test('separa primeiro nome e sobrenome', () => {
    expect(splitFullName('Jucemar de Oliveira')).toEqual({ primeiro_nome: 'Jucemar', sobrenome: 'de Oliveira' });
  });
});
