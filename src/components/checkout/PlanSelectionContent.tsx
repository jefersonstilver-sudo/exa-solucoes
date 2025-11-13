
import React from 'react';
import { motion } from 'framer-motion';
import PlanSelector from './PlanSelector';
import PlanContinueButton from './PlanContinueButton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { Plan, PlanKey } from '@/types/checkout';
import { Panel } from '@/types/panel';
import { formatCurrency } from '@/utils/priceUtils';
import { calculateTotalPrice } from '@/utils/checkoutUtils';

interface CartItem {
  panel: Panel;
  duration: number;
  price?: number;
}

interface PlanSelectionContentProps {
  selectedPlan: PlanKey;
  onSelectPlan: (plan: PlanKey) => void;
  plans: Record<number, Plan>;
  panelCount: number;
  totalPrice: number;
  onContinue: () => void;
  cartItems: CartItem[];
}

const PlanSelectionContent: React.FC<PlanSelectionContentProps> = ({
  selectedPlan,
  onSelectPlan,
  plans,
  panelCount,
  totalPrice,
  onContinue,
  cartItems
}) => {
  // CORREÇÃO: Recalcular preço usando função consistente baseada no preço do prédio
  const recalculatedPrice = React.useMemo(() => {
    if (!selectedPlan || cartItems.length === 0) {
      return 0;
    }

    const result = calculateTotalPrice(selectedPlan, cartItems, 0, false);
    
    console.log("💰 [PlanSelectionContent] PREÇO RECALCULADO BASEADO NO PRÉDIO:", {
      selectedPlan,
      cartItemsLength: cartItems.length,
      originalTotalPrice: totalPrice,
      recalculatedPrice: result,
      cartDetails: cartItems.map(item => ({
        panelId: item.panel.id,
        buildingName: item.panel.buildings?.nome,
        preco_base: item.panel.buildings?.preco_base
      }))
    });

    return result;
  }, [selectedPlan, cartItems, totalPrice]);

  return (
    <div className="space-y-2 sm:space-y-8 mt-3 sm:mt-0">
      {/* Cart Summary - Mobile Compacto */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border p-2.5 sm:p-6"
      >
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ShoppingCart className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-700" />
            <h3 className="text-xs sm:text-lg font-semibold text-gray-900">Carrinho</h3>
          </div>
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-[10px] sm:text-sm px-1.5 py-0.5 sm:px-2 sm:py-1">
            {panelCount} {panelCount === 1 ? 'prédio' : 'prédios'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
          <div className="bg-gray-50 rounded-md p-1.5 sm:p-3 text-center">
            <div className="text-[9px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Prédios</div>
            <div className="text-sm sm:text-xl font-bold text-gray-900">{panelCount}</div>
          </div>
          <div className="bg-gray-50 rounded-md p-1.5 sm:p-3 text-center">
            <div className="text-[9px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Plano</div>
            <div className="text-sm sm:text-xl font-bold text-gray-900">
              {selectedPlan} {selectedPlan === 1 ? 'mês' : 'meses'}
            </div>
          </div>
          <div className="bg-blue-50 rounded-md p-1.5 sm:p-3 text-center">
            <div className="text-[9px] sm:text-sm text-blue-700 mb-0.5 sm:mb-1">Total</div>
            <div className="text-sm sm:text-xl font-bold text-blue-700">
              {formatCurrency(recalculatedPrice)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Plan Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border p-2.5 sm:p-6"
      >
        <PlanSelector
          selectedPlan={selectedPlan}
          onSelectPlan={onSelectPlan}
          plans={plans}
          panelCount={panelCount}
          cartItems={cartItems}
          onContinue={onContinue}
        />
      </motion.div>
    </div>
  );
};

export default PlanSelectionContent;
