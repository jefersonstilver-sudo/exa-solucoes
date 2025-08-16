import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Tag, Smartphone, TrendingDown } from 'lucide-react';
import { CartItem } from '@/types/cart';
import { PlanKey } from '@/types/checkout';
import { calculateTotalPrice, calculateCartSubtotal } from '@/utils/checkoutUtils';
interface PricingBreakdownProps {
  cartItems: CartItem[];
  selectedPlan: PlanKey | null;
  couponValid?: boolean;
  couponDiscount?: number;
  pixDiscount: number;
  paymentMethod: 'pix' | 'credit_card';
}
const PricingBreakdown: React.FC<PricingBreakdownProps> = ({
  cartItems,
  selectedPlan,
  couponValid = false,
  couponDiscount = 0,
  pixDiscount,
  paymentMethod
}) => {
  console.log('[PricingBreakdown] Debug:', {
    cartItemsCount: cartItems?.length || 0,
    selectedPlan,
    couponValid,
    couponDiscount,
    pixDiscount,
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
  const pixDiscountAmount = paymentMethod === 'pix' ? totalAfterCoupon * pixDiscount / 100 : 0;

  // CRÍTICO: Usar calculateTotalPrice para garantir valor mínimo de R$ 0,05
  const finalTotal = calculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid);
  const totalSavings = couponDiscountAmount + pixDiscountAmount;
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  return <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
        <CardTitle className="flex items-center text-xl font-bold">
          <Calculator className="h-6 w-6 mr-3" />
          Detalhamento de Preços
        </CardTitle>
        <p className="text-green-100 mt-2">
          Veja como chegamos ao valor final
        </p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Valor Base */}
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-700 font-medium">
            Valor base ({cartItems.length} {cartItems.length === 1 ? 'painel' : 'painéis'} × {selectedPlan} {selectedPlan === 1 ? 'mês' : 'meses'})
          </span>
          <span className="font-bold text-gray-900">{formatCurrency(baseTotal)}</span>
        </div>

        {/* Desconto do Cupom */}
        {couponValid && couponDiscount > 0 && <motion.div initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }} className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-orange-500" />
              <span className="text-orange-600 font-medium">
                Desconto do cupom ({couponDiscount}%)
              </span>
            </div>
            <span className="font-bold text-orange-600">
              -{formatCurrency(couponDiscountAmount)}
            </span>
          </motion.div>}

        {/* Subtotal após cupom */}
        {couponValid && couponDiscount > 0}

        {/* Desconto PIX */}
        {paymentMethod === 'pix' && <motion.div initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }} className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">
                Desconto PIX ({pixDiscount}%)
              </span>
            </div>
            <span className="font-bold text-green-600">
              -{formatCurrency(pixDiscountAmount)}
            </span>
          </motion.div>}

        {/* Total Final */}
        <motion.div initial={{
        opacity: 0,
        scale: 0.95
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="flex justify-between items-center py-4 border-t-2 border-gray-200 bg-gradient-to-r from-[#3C1361]/5 to-purple-100/50 -mx-6 px-6 mt-6">
          <span className="text-xl font-bold text-[#3C1361]">TOTAL FINAL</span>
          <span className="text-2xl font-bold text-[#3C1361]">
            {formatCurrency(finalTotal)}
          </span>
        </motion.div>

        {/* Economia Total */}
        {totalSavings > 0 && <motion.div initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <div className="flex items-center space-x-2 text-green-800">
              <TrendingDown className="h-5 w-5" />
              <span className="font-bold">
                Você está economizando {formatCurrency(totalSavings)}!
              </span>
            </div>
            <div className="text-sm text-green-700 mt-1">
              {couponDiscountAmount > 0 && <span>Cupom: {formatCurrency(couponDiscountAmount)}</span>}
              {couponDiscountAmount > 0 && pixDiscountAmount > 0 && <span> + </span>}
              {pixDiscountAmount > 0 && <span>PIX: {formatCurrency(pixDiscountAmount)}</span>}
            </div>
          </motion.div>}

        {/* Informações adicionais */}
        <div className="text-xs text-gray-500 mt-4 space-y-1">
          <p>• Valores incluem todos os painéis selecionados</p>
          <p>• Campanha inicia após aprovação do material</p>
          <p>• Faturamento mensal conforme plano escolhido</p>
        </div>
      </CardContent>
    </Card>;
};
export default PricingBreakdown;