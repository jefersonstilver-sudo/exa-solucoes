import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
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
      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 }
        }}
        className="h-full"
      >
        <Card className="h-full flex items-center justify-center p-8 border-dashed border-2 border-gray-200 rounded-2xl bg-gray-50/30">
          <p className="text-sm text-gray-400 text-center">
            Adicione painéis ao carrinho
          </p>
        </Card>
      </motion.div>
    );
  }

  if (!dynamicPricing) {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 }
        }}
        className="h-full"
      >
        <Card className="h-full flex items-center justify-center p-8 rounded-2xl bg-white shadow-md">
          <p className="text-sm text-gray-400">Calculando...</p>
        </Card>
      </motion.div>
    );
  }

  const { dynamicPricePerMonth, dynamicTotalPrice } = dynamicPricing;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card 
        className={`
          relative h-full cursor-pointer transition-all duration-300 rounded-2xl overflow-hidden
          ${isSelected 
            ? 'border-2 border-[#9C1E1E] ring-4 ring-[#9C1E1E]/10 shadow-2xl shadow-[#9C1E1E]/10 bg-gradient-to-br from-white to-[#9C1E1E]/[0.02]' 
            : `border ${plan.months === 12 ? 'border-amber-400/30 shadow-lg shadow-amber-500/5' : 'border-gray-100 shadow-md'} hover:border-gray-200 hover:shadow-xl bg-white`
          }
        `}
        onClick={onSelect}
      >
        {/* Selection Indicator - Top Right */}
        <div className="absolute top-2 right-2 z-30">
          {isSelected ? (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#9C1E1E] to-[#D72638] flex items-center justify-center shadow-lg">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
          ) : (
            <Circle className="w-6 h-6 text-gray-300" strokeWidth={2} />
          )}
        </div>

        {/* Premium Badge - Annual Only */}
        {plan.months === 12 && (
          <Badge 
            className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] px-1.5 py-0.5 shadow-sm z-20 font-semibold whitespace-nowrap"
          >
            ⭐ MELHOR
          </Badge>
        )}

        {/* Discount Badge */}
        {plan.discount > 0 && (
          <Badge 
            className={`absolute ${plan.months === 12 ? 'top-8' : 'top-2'} left-2 bg-[#9C1E1E] text-white text-[9px] px-1.5 py-0.5 shadow-sm z-10 font-medium whitespace-nowrap`}
          >
            -{plan.discount}%
          </Badge>
        )}

        {/* Card Content - Compact */}
        <CardContent className="pt-12 pb-4 px-3 sm:px-4 text-center">
          {/* Plan Name */}
          <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-3">
            {plan.name}
          </h3>

          {/* Price per Month - Compact */}
          <div className="mb-3">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent whitespace-nowrap">
                {formatCurrency(dynamicPricePerMonth)}
              </span>
              <span className="text-sm font-normal text-gray-400">/mês</span>
            </div>
          </div>

          {/* Total Price */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl py-2.5 px-3 border border-gray-100/50">
            <p className="text-xs sm:text-sm text-gray-600">
              Total: <span className="font-bold text-gray-900">{formatCurrency(dynamicTotalPrice)}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              {plan.months} {plan.months === 1 ? 'mês' : 'meses'}
            </p>
            {/* Loyalty Contract Text - Only for 3, 6, 12 months */}
            {plan.months >= 3 && (
              <p className="text-[9px] text-gray-400 mt-1.5 italic">
                contrato fidelidade
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PlanCard;
