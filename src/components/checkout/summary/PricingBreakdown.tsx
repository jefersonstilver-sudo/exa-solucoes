import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Tag, Smartphone, TrendingDown } from 'lucide-react';
import { CartItem } from '@/types/cart';
import { PlanKey } from '@/types/checkout';
import { calculateTotalPrice, calculateCartSubtotal } from '@/utils/checkoutUtils';
import { MINIMUM_ORDER_VALUE } from '@/utils/priceCalculator';
interface PricingBreakdownProps {
  cartItems: CartItem[];
  selectedPlan: PlanKey | null;
  couponValid?: boolean;
  couponDiscount?: number;
  paymentMethod: 'pix' | 'credit_card';
}
const PricingBreakdown: React.FC<PricingBreakdownProps> = ({
  cartItems,
  selectedPlan,
  couponValid = false,
  couponDiscount = 0,
  paymentMethod
}) => {
  console.log('[PricingBreakdown] Debug:', {
    cartItemsCount: cartItems?.length || 0,
    selectedPlan,
    couponValid,
    couponDiscount,
    paymentMethod
  });
  if (!selectedPlan || !cartItems || cartItems.length === 0) {
    return <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 font-medium">Dados insuficientes para calcular preços</p>
        </CardContent>
      </Card>;
  }

  // CORREÇÃO: Usar funções centralizadas que aplicam valor mínimo
  const baseTotal = calculateTotalPrice(selectedPlan, cartItems, 0, false);
  const couponDiscountAmount = couponValid && couponDiscount > 0 ? baseTotal * couponDiscount / 100 : 0;
  const totalAfterCoupon = baseTotal - couponDiscountAmount;

  // CRÍTICO: Total final COM valor mínimo de R$ 0,05
  const finalTotal = Math.max(totalAfterCoupon, MINIMUM_ORDER_VALUE);
  const totalSavings = couponDiscountAmount;

  console.log('💰 [PricingBreakdown] CÁLCULO COM VALOR MÍNIMO:', {
    baseTotal,
    couponDiscountAmount,
    totalAfterCoupon,
    MINIMUM_ORDER_VALUE,
    finalTotal,
    appliedMinimum: totalAfterCoupon < MINIMUM_ORDER_VALUE
  });
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  return (
    <Card className="shadow-sm border">
      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-lg font-semibold">
          Resumo Financeiro
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 pt-0 space-y-1.5 sm:space-y-2">
        {/* Valor Base */}
        <div className="flex justify-between items-center py-1.5 sm:py-2 border-b">
          <span className="text-xs sm:text-sm text-gray-600">
            Valor base ({cartItems.length} × {selectedPlan}m)
          </span>
          <span className="font-semibold text-sm sm:text-base text-gray-900">{formatCurrency(baseTotal)}</span>
        </div>

        {/* Desconto do Cupom */}
        {couponValid && couponDiscount > 0 && (
          <div className="flex justify-between items-center py-1.5 sm:py-2 border-b">
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <Tag className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500" />
              <span className="text-xs sm:text-sm text-orange-600">
                Cupom ({couponDiscount}%)
              </span>
            </div>
            <span className="font-semibold text-sm sm:text-base text-orange-600">
              -{formatCurrency(couponDiscountAmount)}
            </span>
          </div>
        )}

        {/* Total Final */}
        <div className="flex justify-between items-center pt-2 sm:pt-3 border-t-2">
          <span className="text-sm sm:text-base font-bold text-gray-900">TOTAL</span>
          <span className="text-lg sm:text-xl font-bold text-gray-900">
            {formatCurrency(finalTotal)}
          </span>
        </div>

        {/* Mensagem de Valor Mínimo */}
        {totalAfterCoupon < MINIMUM_ORDER_VALUE && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
            <p className="text-[10px] sm:text-xs text-blue-800">
              <strong>Valor mínimo:</strong> R$ 0,05 é o valor simbólico de ativação. Pagamento via PIX.
            </p>
          </div>
        )}

        {/* Economia Total */}
        {totalSavings > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-green-700" />
              <span className="text-xs sm:text-sm font-semibold text-green-800">
                Economia: {formatCurrency(totalSavings)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default PricingBreakdown;