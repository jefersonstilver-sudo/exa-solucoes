import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plan, PlanKey } from '@/types/checkout';
import { formatCurrency } from '@/utils/priceUtils';
import { Panel } from '@/types/panel';
import { logPriceCalculation } from '@/utils/auditLogger';
import { getPlanWithDynamicPricing } from '@/utils/checkoutUtils';

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
  const [dynamicPricing, setDynamicPricing] = useState<any>(null);
  
  useEffect(() => {
    if (cartItems.length > 0) {
      const dynamicPlan = getPlanWithDynamicPricing(planKey, cartItems);
      
      if (dynamicPlan) {
        setDynamicPricing(dynamicPlan);
        
        logPriceCalculation(`PlanCard-${planKey}`, {
          planKey,
          cartItemsCount: cartItems.length,
          dynamicPricing: dynamicPlan
        });
      }
    } else {
      setDynamicPricing(null);
    }
  }, [planKey, cartItems]);

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

  if (!dynamicPricing) {
    return (
      <Card className="border-2 border-gray-200 bg-white">
        <CardContent className="p-4 sm:p-5 text-center">
          <div className="h-8 w-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">
            Calculando preços...
          </p>
        </CardContent>
      </Card>
    );
  }

  const { dynamicPricePerMonth, dynamicTotalPrice } = dynamicPricing;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card 
        className={`
          overflow-hidden transition-all cursor-pointer h-full flex flex-col border-2 bg-white
          ${isSelected 
            ? 'border-blue-500 ring-2 ring-blue-100 shadow-lg' 
            : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
          }
        `}
        onClick={onSelect}
      >
        <CardContent className="p-6 flex-grow flex flex-col">
          {/* Plan Name */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {plan.name}
            </h3>
          </div>
          
          {/* Price - Main Focus */}
          <div className="text-center mb-6">
            <div className="flex justify-center items-baseline mb-3">
              <span className="text-4xl font-bold text-gray-900">
                {formatCurrency(dynamicPricePerMonth)}
              </span>
              <span className="text-gray-500 text-base ml-1">/mês</span>
            </div>
            
            {/* Total Price */}
            <div className="bg-gray-50 py-3 px-4 rounded-lg mb-3">
              <div className="text-sm font-medium text-gray-700">
                Total: {formatCurrency(dynamicTotalPrice)}
              </div>
              {plan.months > 1 && (
                <div className="text-xs text-gray-500 mt-1">
                  ({plan.months} meses)
                </div>
              )}
            </div>
            
            {/* Discount Badge */}
            {plan.discount > 0 && (
              <Badge className="bg-green-50 text-green-700 hover:bg-green-50 text-sm px-3 py-1 border border-green-200">
                {plan.discount}% OFF
              </Badge>
            )}
          </div>
        </CardContent>
        
        <CardFooter className={`
          px-6 py-4 border-t flex justify-between items-center
          ${isSelected ? 'border-t-blue-200 bg-blue-50/50' : 'border-t-gray-100'}
        `}>
          {isSelected ? (
            <span className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Selecionado
            </span>
          ) : (
            <span className="text-sm text-gray-600">
              Selecionar
            </span>
          )}
          
          <div className={`
            h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all
            ${isSelected 
              ? 'border-blue-500 bg-blue-500' 
              : 'border-gray-300'
            }
          `}>
            {isSelected && (
              <CheckCircle className="h-4 w-4 text-white" />
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PlanCard;
