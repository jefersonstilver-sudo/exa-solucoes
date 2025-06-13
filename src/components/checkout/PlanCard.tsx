import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Video, Gift, Building } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plan, PlanKey } from '@/types/checkout';
import { formatCurrency } from '@/utils/priceUtils';
import { Panel } from '@/types/panel';
import { logPriceCalculation } from '@/utils/auditLogger';

interface CartItem {
  panel: Panel;
  duration: number;
  price?: number;
}

interface PlanCardProps {
  plan: Plan;
  planKey: PlanKey;
  isSelected: boolean;
  onSelect: () => void;
  cartItems: CartItem[];
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  planKey,
  isSelected,
  onSelect,
  cartItems
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [dynamicPricing, setDynamicPricing] = useState<any>(null);
  
  // Calcular preços dinamicamente baseados no carrinho com preços corretos
  useEffect(() => {
    if (cartItems.length > 0) {
      console.log("💰 [PlanCard] Calculando preços dinâmicos corrigidos:", {
        planKey,
        cartItemsLength: cartItems.length
      });
      
      // Preços específicos por plano conforme especificação
      const pricePerMonth = {
        1: 200,   // R$ 200/mês
        3: 160,   // R$ 160/mês (R$ 200 - 20%)
        6: 140,   // R$ 140/mês 
        12: 125   // R$ 125/mês
      };

      const monthlyPricePerPanel = pricePerMonth[planKey];
      const totalPanels = cartItems.length;
      const totalPrice = totalPanels * monthlyPricePerPanel * planKey;
      const pricePerMonthTotal = totalPanels * monthlyPricePerPanel;
      
      // Calcular economia comparado ao plano mensal
      const monthlyPlanTotal = totalPanels * pricePerMonth[1] * planKey;
      const savings = planKey > 1 ? monthlyPlanTotal - totalPrice : 0;

      const dynamicPlan = {
        dynamicPricePerMonth: pricePerMonthTotal,
        dynamicTotalPrice: totalPrice,
        dynamicSavings: savings
      };
      
      setDynamicPricing(dynamicPlan);
      
      // Log para auditoria
      logPriceCalculation(`PlanCard-${planKey}`, {
        planKey,
        cartItemsCount: cartItems.length,
        monthlyPricePerPanel,
        dynamicPricing: dynamicPlan
      });
    } else {
      console.log("💰 [PlanCard] Carrinho vazio, resetando preços");
      setDynamicPricing(null);
    }
  }, [planKey, cartItems]);
  
  // Definir cores mais suaves baseadas no tipo de plano
  const getCardColors = () => {
    if (planKey === 6) {
      return {
        border: isSelected ? 'border-[#B794F4] bg-[#F1F0FB]' : 'border-gray-300 hover:border-[#B794F4] bg-white',
        text: 'text-[#1A1F2C]',
        header: 'bg-[#D6BCFA] text-[#1A1F2C]',
        accent: 'text-[#B794F4]'
      };
    }
    
    const colorMap = {
      gray: {
        border: isSelected ? 'border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-gray-400 bg-white',
        text: 'text-gray-700',
        header: 'bg-gray-200 text-gray-700',
        accent: 'text-gray-600'
      },
      green: {
        border: isSelected ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-green-400 bg-white',
        text: 'text-green-700',
        header: 'bg-green-200 text-green-800',
        accent: 'text-green-600'
      },
      blue: {
        border: isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-white',
        text: 'text-blue-700',
        header: 'bg-blue-200 text-blue-800',
        accent: 'text-blue-600'
      }
    };
    
    return colorMap[plan.color as keyof typeof colorMap] || colorMap.gray;
  };
  
  const colors = getCardColors();

  // Não mostrar card se carrinho estiver vazio
  if (!cartItems.length) {
    return (
      <Card className="border-2 border-gray-200 bg-gray-50 opacity-50">
        <CardContent className="p-4 sm:p-5 text-center">
          <p className="text-gray-500 text-sm">
            Adicione prédios ao carrinho para ver os preços
          </p>
        </CardContent>
      </Card>
    );
  }

  // Aguardar cálculo dos preços dinâmicos
  if (!dynamicPricing) {
    return (
      <Card className="border-2 border-gray-200 bg-white">
        <CardContent className="p-4 sm:p-5 text-center">
          <div className="h-8 w-8 border-2 border-[#3C1361] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">
            Calculando preços...
          </p>
        </CardContent>
      </Card>
    );
  }

  const { dynamicPricePerMonth, dynamicTotalPrice, dynamicSavings } = dynamicPricing;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.4 }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' 
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card 
        className={`
          overflow-hidden transition-all cursor-pointer h-full flex flex-col border-2
          ${colors.border}
          ${planKey === 6 ? 'ring-2 ring-[#B794F4] ring-opacity-50' : ''}
        `}
        onClick={onSelect}
      >
        {/* Header Tags */}
        {plan.mostPopular && (
          <div className={`${colors.header} text-center py-1.5 text-xs font-medium`}>
            🔥 MAIS POPULAR
          </div>
        )}
        
        {plan.tag && !plan.mostPopular && (
          <div className={`text-center py-1.5 text-xs font-medium ${colors.header}`}>
            {plan.tag}
          </div>
        )}
        
        {planKey === 6 && !plan.tag && (
          <div className="bg-[#D6BCFA] text-[#1A1F2C] text-center py-1.5 text-xs font-medium">
            ✨ RECOMENDADO
          </div>
        )}
        
        <CardContent className="p-4 sm:p-5 flex-grow flex flex-col">
          {/* Plan Title */}
          <div className="text-center mb-4">
            <h3 className={`text-lg sm:text-xl font-bold ${colors.text}`}>
              {plan.name}
            </h3>
            <p className="text-sm text-gray-500">
              {plan.description}
            </p>
          </div>
          
          {/* Dynamic Pricing */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex justify-center items-baseline mb-2">
              <span className={`text-2xl sm:text-3xl font-bold ${planKey === 6 ? 'text-[#1A1F2C]' : 'text-[#3C1361]'}`}>
                {formatCurrency(dynamicPricePerMonth)}
              </span>
              <span className="text-gray-500 text-sm ml-1">/mês</span>
            </div>
            
            {/* Total Price on Hover/Selection */}
            {(isHovered || isSelected) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 py-2 px-3 rounded-lg shadow-sm border border-gray-100 mb-2"
              >
                <div className="text-sm font-medium text-gray-700">
                  Total: {formatCurrency(dynamicTotalPrice)}
                </div>
                {plan.months > 1 && (
                  <div className="text-xs text-gray-500">
                    ({plan.months} meses)
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Discount Badge */}
            {plan.discount > 0 && (
              <div className="flex justify-center gap-2">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                  Economize {plan.discount}%
                </Badge>
                {dynamicSavings > 0 && (
                  <Badge variant="outline" className="text-xs">
                    -{formatCurrency(dynamicSavings)}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Features com benefícios específicos */}
          <div className="space-y-2 sm:space-y-3 mt-auto">
            {plan.extras && plan.extras.length > 0 ? (
              plan.extras.map((extra, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  {extra.includes('🎥') ? (
                    <Video className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.accent} flex-shrink-0 mt-0.5`} />
                  ) : extra.includes('🎬') ? (
                    <Gift className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.accent} flex-shrink-0 mt-0.5`} />
                  ) : extra.includes('estúdio') || extra.includes('Aluguel') ? (
                    <Building className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.accent} flex-shrink-0 mt-0.5`} />
                  ) : (
                    <CheckCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.accent} flex-shrink-0 mt-0.5`} />
                  )}
                  <span className="text-xs sm:text-sm text-gray-600 leading-tight">{extra}</span>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-2">
                <CheckCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.accent} flex-shrink-0 mt-0.5`} />
                <span className="text-xs sm:text-sm text-gray-600 leading-tight">
                  Plano de {plan.months} {plan.months === 1 ? 'mês' : 'meses'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className={`
          px-4 sm:px-5 py-3 border-t flex justify-between items-center
          ${isSelected ? 'border-t-green-200 bg-white/50' : 'border-t-gray-100'}
        `}>
          {isSelected ? (
            <span className="text-sm font-medium text-green-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Selecionado
            </span>
          ) : (
            <span className="text-sm text-gray-500">
              Selecionar
            </span>
          )}
          
          <div className={`
            h-5 w-5 sm:h-6 sm:w-6 rounded-full border flex items-center justify-center
            ${isSelected 
              ? planKey === 6 ? 'border-[#B794F4] bg-[#B794F4]' : 'border-green-500 bg-green-500' 
              : 'border-gray-300'}`
            }
          >
            {isSelected && (
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PlanCard;
