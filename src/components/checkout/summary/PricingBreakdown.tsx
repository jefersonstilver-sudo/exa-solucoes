
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Tag, Gift, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';
import { calculateTotalPrice, calculateCartSubtotal, getPlanDiscount } from '@/utils/checkoutUtils';
import { PLANS } from '@/constants/checkoutConstants';
import { PlanKey } from '@/types/checkout';

interface CartItem {
  panel: any;
  duration: number;
}

interface PricingBreakdownProps {
  cartItems: CartItem[];
  selectedPlan: PlanKey;
  couponValid?: boolean;
  couponDiscount?: number;
  pixDiscount?: number;
  paymentMethod: 'pix' | 'credit_card';
}

const PricingBreakdown: React.FC<PricingBreakdownProps> = ({
  cartItems,
  selectedPlan,
  couponValid = false,
  couponDiscount = 0,
  pixDiscount = 5,
  paymentMethod
}) => {
  // Cálculos de preços
  const subtotalMensal = calculateCartSubtotal(cartItems, 1);
  const selectedMonths = PLANS[selectedPlan]?.months || selectedPlan;
  const subtotalTotal = subtotalMensal * selectedMonths;
  
  // Desconto do plano
  const planDiscountPercent = getPlanDiscount(selectedPlan);
  const planDiscountAmount = subtotalTotal * planDiscountPercent;
  
  // Subtotal após desconto do plano
  const subtotalAfterPlanDiscount = subtotalTotal - planDiscountAmount;
  
  // Desconto do cupom
  const couponDiscountAmount = couponValid && couponDiscount > 0 
    ? (subtotalAfterPlanDiscount * couponDiscount) / 100 
    : 0;
  
  // Subtotal final antes do PIX
  const subtotalBeforePix = subtotalAfterPlanDiscount - couponDiscountAmount;
  
  // Desconto PIX
  const pixDiscountAmount = paymentMethod === 'pix' ? (subtotalBeforePix * pixDiscount) / 100 : 0;
  
  // Total final
  const finalTotal = subtotalBeforePix - pixDiscountAmount;
  
  // Total de economia
  const totalSavings = planDiscountAmount + couponDiscountAmount + pixDiscountAmount;

  return (
    <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-[#3C1361] to-purple-700 text-white p-6">
        <CardTitle className="flex items-center text-xl font-bold">
          <Calculator className="h-6 w-6 mr-3" />
          Resumo de Valores
        </CardTitle>
        <p className="text-purple-100 mt-2">
          Detalhamento completo dos preços
        </p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Subtotal Base */}
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <div className="flex items-center">
            <span className="text-gray-700">Subtotal ({cartItems.length} painéis × {selectedMonths} meses)</span>
          </div>
          <span className="font-semibold text-gray-900">
            {formatCurrency(subtotalTotal)}
          </span>
        </div>

        {/* Desconto do Plano */}
        {planDiscountAmount > 0 && (
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-2 text-orange-500" />
              <span className="text-orange-700">
                Desconto {PLANS[selectedPlan]?.name} ({(planDiscountPercent * 100).toFixed(0)}%)
              </span>
            </div>
            <span className="font-semibold text-orange-600">
              -{formatCurrency(planDiscountAmount)}
            </span>
          </div>
        )}

        {/* Desconto do Cupom */}
        {couponValid && couponDiscountAmount > 0 && (
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center">
              <Gift className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-green-700">
                Desconto Cupom ({couponDiscount}%)
              </span>
            </div>
            <span className="font-semibold text-green-600">
              -{formatCurrency(couponDiscountAmount)}
            </span>
          </div>
        )}

        {/* Desconto PIX */}
        {paymentMethod === 'pix' && pixDiscountAmount > 0 && (
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-blue-500" />
              <span className="text-blue-700">
                Desconto PIX ({pixDiscount}%)
              </span>
              <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                Pagamento Instantâneo
              </Badge>
            </div>
            <span className="font-semibold text-blue-600">
              -{formatCurrency(pixDiscountAmount)}
            </span>
          </div>
        )}

        {/* Total Final */}
        <div className="bg-gradient-to-r from-[#3C1361]/5 to-purple-100 rounded-lg p-4 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-lg font-bold text-gray-900">Total Final</span>
              {totalSavings > 0 && (
                <div className="text-sm text-green-600 font-medium mt-1">
                  ✅ Você economizou {formatCurrency(totalSavings)}!
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#3C1361]">
                {formatCurrency(finalTotal)}
              </div>
              {paymentMethod === 'pix' && (
                <div className="text-sm text-blue-600 font-medium">
                  Com desconto PIX
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Valor por painel/mês:</span>
              <span className="font-medium">
                {formatCurrency(finalTotal / (cartItems.length * selectedMonths))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Período total:</span>
              <span className="font-medium">
                {selectedMonths} {selectedMonths === 1 ? 'mês' : 'meses'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingBreakdown;
