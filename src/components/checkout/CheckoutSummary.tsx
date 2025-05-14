import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/priceUtils';
import { Panel } from '@/types/panel';
import { Plan, PlanKey } from '@/types/checkout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, PackageCheck } from 'lucide-react';
import { getPanelPrice } from '@/utils/checkoutUtils';

interface CheckoutSummaryProps {
  cartItems: { panel: Panel; duration: number }[];
  selectedPlan: PlanKey;
  plans: Record<number, Plan>;
  couponDiscount: number;
  startDate: Date;
  endDate: Date;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  cartItems,
  selectedPlan,
  plans,
  couponDiscount,
  startDate,
  endDate
}) => {
  // Formata data para o formato brasileiro
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };
  
  // Calcula subtotal somando o preço de cada painel
  const calculateSubtotal = (): number => {
    // Soma o preço de cada painel com base na duração
    return cartItems.reduce((total, item) => {
      const panelPrice = getPanelPrice(item.panel, item.duration);
      console.log(`Painel ${item.panel.buildings?.nome}: R$ ${panelPrice}`);
      return total + panelPrice;
    }, 0);
  };
  
  // Calcula desconto do plano
  const calculatePlanDiscount = (): number => {
    const planDiscount = plans[selectedPlan].discount;
    if (planDiscount <= 0) {
      return 0;
    }
    
    const subtotal = calculateSubtotal();
    return (subtotal * planDiscount) / 100;
  };
  
  // Calcula desconto do cupom
  const calculateCouponDiscount = (): number => {
    if (couponDiscount <= 0) {
      return 0;
    }
    
    const subtotalAfterPlanDiscount = calculateSubtotal() - calculatePlanDiscount();
    return (subtotalAfterPlanDiscount * couponDiscount) / 100;
  };
  
  // Calcula total
  const calculateTotal = (): number => {
    const subtotal = calculateSubtotal();
    const planDiscountAmount = calculatePlanDiscount();
    const couponDiscountAmount = calculateCouponDiscount();
    
    return subtotal - planDiscountAmount - couponDiscountAmount;
  };

  // Para debugging
  console.log("Carrinho no CheckoutSummary:", cartItems);
  console.log("Subtotal calculado:", calculateSubtotal());
  console.log("Total após descontos:", calculateTotal());
  
  return (
    <Card className="sticky top-8 rounded-2xl shadow-md overflow-hidden border border-gray-200">
      <CardHeader className="bg-gradient-to-r from-[#1E1B4B] to-[#2D2A6B] border-b border-gray-100 p-4">
        <CardTitle className="flex items-center text-white">
          <PackageCheck className="mr-2 h-5 w-5" /> Resumo do pedido
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5 space-y-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h3 className="text-sm font-medium mb-2">Detalhes</h3>
          <div className="text-sm space-y-2 bg-gray-50 p-3 rounded-xl">
            <div className="flex justify-between">
              <span className="text-gray-600">Qtde. painéis:</span>
              <span className="font-medium">{cartItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Plano:</span>
              <span className="font-medium">
                {selectedPlan === 1 ? 'Mensal' :
                 selectedPlan === 3 ? 'Trimestral' :
                 selectedPlan === 6 ? 'Semestral' :
                 'Anual'}
              </span>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h3 className="text-sm font-medium mb-2">Período</h3>
          <div className="text-sm space-y-2">
            <div className="flex items-center text-gray-600 text-xs mb-1">
              <Calendar className="h-3.5 w-3.5 mr-1" /> Exibição
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
              <div className="flex justify-between mb-2">
                <span>Início:</span>
                <span className="font-medium">{formatDate(startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Término:</span>
                <span className="font-medium">{formatDate(endDate)}</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        <Separator className="my-3" />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
          </div>
          
          {plans[selectedPlan].discount > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-green-600">Desconto ({plans[selectedPlan].discount}%):</span>
              <span className="text-green-600">-{formatCurrency(calculatePlanDiscount())}</span>
            </div>
          )}
          
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-green-600">Cupom ({couponDiscount}%):</span>
              <span className="text-green-600">-{formatCurrency(calculateCouponDiscount())}</span>
            </div>
          )}
          
          <div className="flex justify-between mt-4 text-indexa-purple">
            <span className="font-semibold">Total:</span>
            <motion.span 
              className="font-bold text-lg"
              key={calculateTotal().toString()}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {formatCurrency(calculateTotal())}
            </motion.span>
          </div>
        </motion.div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 p-4 text-xs text-gray-500 border-t border-gray-100">
        <p>
          Os preços já incluem impostos e taxas de processamento. A campanha ficará ativa após confirmação do pagamento.
        </p>
      </CardFooter>
    </Card>
  );
};

export default CheckoutSummary;
