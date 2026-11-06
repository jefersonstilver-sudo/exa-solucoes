import { describe, expect, test } from 'bun:test';
import { applyCouponToItems } from './couponMath';

const items = [
  { buildingId: 'a', price: 300 },
  { buildingId: 'b', price: 200 },
];

describe('cupom', () => {
  test('percentual em todos os prédios', () => {
    expect(applyCouponToItems(items, { tipo: 'percentual', valor: 10, planMonths: 3 })).toBeCloseTo(450);
  });
  test('desconto parcial só nos prédios da lista', () => {
    expect(applyCouponToItems(items, { tipo: 'percentual', valor: 50, planMonths: 3, parcial: true, elegiveis: ['a'] })).toBeCloseTo(350);
  });
  test('valor fixo com centavos', () => {
    expect(applyCouponToItems(items, { tipo: 'valor_fixo', valor: 99.9, planMonths: 1 })).toBeCloseTo(400.1);
  });
  test('valor por mês multiplica pelos meses', () => {
    expect(applyCouponToItems(items, { tipo: 'mensal_fixo', valor: 199.9, planMonths: 3 })).toBeCloseTo(599.7);
  });
  test('preço final ignora o subtotal', () => {
    expect(applyCouponToItems(items, { tipo: 'preco_final', valor: 150.5, planMonths: 6 })).toBeCloseTo(150.5);
  });
  test('nunca abaixo de R$ 0,05', () => {
    expect(applyCouponToItems(items, { tipo: 'valor_fixo', valor: 9999, planMonths: 1 })).toBe(0.05);
  });
});
