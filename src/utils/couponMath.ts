/**
 * Cálculo do desconto de cupom — espelha a regra da função validate-order-price.
 * desconto_parcial: o desconto incide só sobre os prédios elegíveis.
 */
export type CouponMathType = 'percentual' | 'valor_fixo' | 'preco_final' | 'mensal_fixo';

export interface CouponMathItem { buildingId: string; price: number }
export interface CouponMathInput {
  tipo: CouponMathType;
  valor: number;
  planMonths: number;
  parcial?: boolean;
  elegiveis?: string[];
}

export const MIN_ORDER_VALUE = 0.05;

export function applyCouponToItems(items: CouponMathItem[], c: CouponMathInput): number {
  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const base = c.parcial && c.elegiveis
    ? items.filter(i => c.elegiveis!.includes(i.buildingId)).reduce((s, i) => s + i.price, 0)
    : subtotal;
  const resto = subtotal - base;
  const v = Number(c.valor) || 0;
  let total: number;
  switch (c.tipo) {
    case 'preco_final': total = v; break;
    case 'valor_fixo': total = resto + Math.max(base - v, 0); break;
    case 'mensal_fixo': total = resto + v * (c.planMonths || 1); break;
    default: total = resto + base * (1 - v / 100);
  }
  return Math.max(total, MIN_ORDER_VALUE);
}
