import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, TrendingDown, Zap, CalendarCheck, FileText } from 'lucide-react';
import { CartItem } from '@/types/cart';
import { PlanKey, PaymentMethodType } from '@/types/checkout';
import { calculateTotalPrice } from '@/utils/checkoutUtils';
import { MINIMUM_ORDER_VALUE } from '@/utils/priceCalculator';

interface PricingBreakdownProps {
  cartItems: CartItem[];
  selectedPlan: PlanKey | null;
  couponValid?: boolean;
  couponDiscount?: number;
  paymentMethod: PaymentMethodType;
  couponCode?: string;
  couponCategoria?: string;
  finalTotal?: number;
}

const PricingBreakdown: React.FC<PricingBreakdownProps> = ({
  cartItems,
  selectedPlan,
  couponValid = false,
  couponDiscount = 0,
  paymentMethod,
  couponCode,
  couponCategoria,
  finalTotal: externalFinalTotal
}) => {
  // Detectar cupom cortesia
  const isCortesia = couponCategoria === 'cortesia' || couponCode?.toUpperCase().trim() === 'CORTESIA_ADMIN';
  
  // Detectar tipo de pagamento
  const isPixAvista = paymentMethod === 'pix_avista';
  const isFidelidade = paymentMethod === 'pix_fidelidade' || paymentMethod === 'boleto_fidelidade';
  const pixAvistaDiscount = 0.10; // 10% desconto PIX à vista
  
  // Calcular total de PAINÉIS
  const totalPaineis = cartItems.reduce((total, item) => {
    const numeroElevadores = item.panel.buildings?.numero_elevadores || 0;
    const quantidadeTelas = item.panel.buildings?.quantidade_telas || 0;
    const telas = numeroElevadores > 0 ? numeroElevadores : (quantidadeTelas || 1);
    return total + telas;
  }, 0);
  
  // Calcular exibições totais
  const exibicoesPorMes = cartItems.reduce((total, item) => {
    const visualizacoes = item.panel.buildings?.visualizacoes_mes || 0;
    return total + visualizacoes;
  }, 0);

  if (!selectedPlan || !cartItems || cartItems.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 font-medium">Dados insuficientes para calcular preços</p>
        </CardContent>
      </Card>
    );
  }

  // Calcular valores
  const baseTotal = calculateTotalPrice(selectedPlan, cartItems, 0, false, undefined, couponCategoria);
  const couponDiscountAmount = couponValid && couponDiscount > 0 ? baseTotal * couponDiscount / 100 : 0;
  const totalAfterCoupon = baseTotal - couponDiscountAmount;
  
  // Calcular desconto PIX à vista
  const pixDiscountAmount = isPixAvista ? totalAfterCoupon * pixAvistaDiscount : 0;
  const totalWithPixDiscount = totalAfterCoupon - pixDiscountAmount;
  
  // Valor final (usar externo se disponível, senão calcular)
  const finalTotal = isCortesia ? 0 : (externalFinalTotal ?? Math.max(totalWithPixDiscount, MINIMUM_ORDER_VALUE));
  
  // Valor da parcela para fidelidade
  const monthlyAmount = isFidelidade ? totalAfterCoupon / selectedPlan : 0;
  
  // Total de economia
  const totalSavings = couponDiscountAmount + pixDiscountAmount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  return (
    <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3 bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
          Resumo Financeiro
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-5 pt-2 space-y-3">
        {/* Valor Base */}
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <div className="flex flex-col">
            <span className="text-sm text-gray-600">
              Valor base ({totalPaineis} {totalPaineis === 1 ? 'painel' : 'painéis'} × {selectedPlan}m)
            </span>
            {exibicoesPorMes > 0 && (
              <span className="text-xs text-violet-600 font-medium">
                {exibicoesPorMes.toLocaleString('pt-BR')} exibições/mês
              </span>
            )}
          </div>
          <span className="font-semibold text-gray-900">{formatCurrency(baseTotal)}</span>
        </div>

        {/* Desconto do Cupom */}
        {couponValid && couponDiscount > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-600">
                Cupom ({couponDiscount}%)
              </span>
            </div>
            <span className="font-semibold text-orange-600">
              -{formatCurrency(couponDiscountAmount)}
            </span>
          </div>
        )}

        {/* Desconto PIX à Vista */}
        {isPixAvista && pixDiscountAmount > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-emerald-600">
                PIX à Vista (5%)
              </span>
            </div>
            <span className="font-semibold text-emerald-600">
              -{formatCurrency(pixDiscountAmount)}
            </span>
          </div>
        )}

        {/* Info Fidelidade */}
        {isFidelidade && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100 bg-blue-50 -mx-4 px-4 sm:-mx-5 sm:px-5">
            <div className="flex items-center gap-2">
              {paymentMethod === 'pix_fidelidade' ? (
                <CalendarCheck className="h-4 w-4 text-blue-500" />
              ) : (
                <FileText className="h-4 w-4 text-violet-500" />
              )}
              <span className="text-sm text-blue-700 font-medium">
                {selectedPlan}x parcelas de
              </span>
            </div>
            <span className="font-bold text-blue-700">
              {formatCurrency(monthlyAmount)}/mês
            </span>
          </div>
        )}

        {/* Total Final */}
        <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
          <span className="text-base font-bold text-gray-900">
            {isFidelidade ? 'TOTAL DO PLANO' : 'TOTAL A PAGAR'}
          </span>
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(isFidelidade ? totalAfterCoupon : finalTotal)}
          </span>
        </div>

        {/* Mensagem de Valor Mínimo */}
        {!isCortesia && !isFidelidade && totalWithPixDiscount < MINIMUM_ORDER_VALUE && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Valor mínimo:</strong> R$ 0,05 é o valor simbólico de ativação.
            </p>
          </div>
        )}

        {/* Economia Total */}
        {totalSavings > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-emerald-700" />
              <span className="text-sm font-semibold text-emerald-800">
                Você economiza: {formatCurrency(totalSavings)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingBreakdown;