
import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/priceUtils';
import { Panel } from '@/types/panel';
import { Plan, PlanKey } from '@/types/checkout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, PackageCheck, Video, Award, Info } from 'lucide-react';
import { getPanelPrice, calculateCartSubtotal, calculateTotalPrice } from '@/utils/checkoutUtils';
import { Badge } from '@/components/ui/badge';

interface CheckoutSummaryProps {
  cartItems: { panel: Panel; duration: number }[];
  selectedPlan: PlanKey;
  plans: Record<number, Plan>;
  couponDiscount: number;
  couponValid: boolean;
  startDate: Date;
  endDate: Date;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  cartItems,
  selectedPlan,
  plans,
  couponDiscount,
  couponValid,
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
  
  // Get subtotal and total prices
  const subtotal = calculateCartSubtotal(cartItems);
  const totalPrice = calculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid);
  
  // Calculate plan discount amount
  const planDiscountAmount = plans[selectedPlan].discount > 0 
    ? (subtotal * plans[selectedPlan].discount) / 100 
    : 0;
  
  // Calculate coupon discount amount
  const couponDiscountAmount = couponValid && couponDiscount > 0
    ? ((subtotal - planDiscountAmount) * couponDiscount) / 100
    : 0;
  
  // Get plan color for styling
  const getPlanColorClass = () => {
    const colorMap = {
      'gray': 'border-gray-300 text-gray-700 bg-gray-50',
      'green': 'border-green-300 text-green-700 bg-green-50',
      'purple': 'border-purple-300 text-purple-700 bg-purple-50',
      'blue': 'border-blue-300 text-blue-700 bg-blue-50'
    };
    
    const color = plans[selectedPlan].color || 'gray';
    return colorMap[color] || colorMap.gray;
  };

  // For debugging - use console.log only
  console.log("Dados do carrinho no CheckoutSummary:", cartItems);
  console.log("Subtotal calculado:", subtotal);
  console.log("Total após descontos:", totalPrice);
  
  return (
    <Card className="sticky top-8 rounded-2xl shadow-md overflow-hidden border border-gray-200">
      <CardHeader className="bg-gradient-to-r from-[#1E1B4B] to-[#2D2A6B] border-b border-gray-100 p-4">
        <CardTitle className="flex items-center text-white">
          <PackageCheck className="mr-2 h-5 w-5" /> Resumo do pedido
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5 space-y-4">
        {/* Selected Plan Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-4"
        >
          <h3 className="text-sm font-medium mb-2">Plano Selecionado</h3>
          <div className={`rounded-lg border p-3 ${getPlanColorClass()}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">{plans[selectedPlan].name}</span>
              {plans[selectedPlan].mostPopular && (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Mais vendido
                </Badge>
              )}
            </div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{plans[selectedPlan].months} {plans[selectedPlan].months === 1 ? 'mês' : 'meses'}</span>
              </div>
              
              {plans[selectedPlan].productionIncluded && (
                <div className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  <span>
                    {plans[selectedPlan].videosPerMonth} vídeo{plans[selectedPlan].videosPerMonth > 1 ? 's' : ''} por mês
                  </span>
                </div>
              )}
              
              {plans[selectedPlan].studioUse && (
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  <span>Uso do Estúdio Indexa</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      
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
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          
          {plans[selectedPlan].discount > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="flex justify-between text-sm mt-1"
            >
              <span className="text-green-600 flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Desconto do plano ({plans[selectedPlan].discount}%):
              </span>
              <span className="text-green-600">-{formatCurrency(planDiscountAmount)}</span>
            </motion.div>
          )}
          
          {couponValid && couponDiscount > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="flex justify-between text-sm mt-1"
            >
              <span className="text-green-600">Cupom ({couponDiscount}%):</span>
              <span className="text-green-600">-{formatCurrency(couponDiscountAmount)}</span>
            </motion.div>
          )}
          
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
            <div className="flex justify-between text-indexa-purple">
              <span className="font-semibold">Total:</span>
              <motion.span 
                className="font-bold text-lg"
                key={totalPrice.toString()}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {formatCurrency(totalPrice)}
              </motion.span>
            </div>
            {(planDiscountAmount > 0 || couponDiscountAmount > 0) && (
              <div className="text-xs text-green-600 text-right mt-1">
                Você economizou {formatCurrency(planDiscountAmount + couponDiscountAmount)}!
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Benefits section */}
        {plans[selectedPlan].productionIncluded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="bg-[#1E1B4B]/5 p-3 rounded-lg border border-[#1E1B4B]/10 mt-4"
          >
            <div className="flex items-start gap-2">
              <Video className="h-4 w-4 text-indexa-purple mt-0.5" />
              <div className="text-xs text-[#1E1B4B]/80">
                <span className="font-medium">Seu plano inclui {plans[selectedPlan].videosPerMonth} vídeo por mês</span> produzido pela Indexa Produtora!
                {plans[selectedPlan].studioUse && (
                  <span className="block mt-1">+ Acesso mensal ao Estúdio Indexa para gravações.</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
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
