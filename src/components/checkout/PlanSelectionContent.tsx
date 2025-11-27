
import React from 'react';
import { motion } from 'framer-motion';
import PlanSelector from './PlanSelector';
import PlanContinueButton from './PlanContinueButton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, DollarSign } from 'lucide-react';
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
    <div className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
      {/* Cart Summary - Elegant Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg"
      >
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          {/* Buildings */}
          <div className="flex flex-col items-center text-center p-4 bg-gray-50/50 rounded-xl">
            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#9C1E1E] mb-2" />
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Prédios</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{panelCount}</p>
          </div>

          {/* Duration */}
          <div className="flex flex-col items-center text-center p-4 bg-gray-50/50 rounded-xl">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-[#9C1E1E] mb-2" />
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Duração</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {selectedPlan ? plans[selectedPlan].months : 0}
            </p>
            <p className="text-xs text-gray-500">
              {selectedPlan && plans[selectedPlan].months === 1 ? 'mês' : 'meses'}
            </p>
          </div>

          {/* Total */}
          <div className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-[#9C1E1E]/5 to-[#D72638]/5 rounded-xl border border-[#9C1E1E]/20">
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-[#9C1E1E] mb-2" />
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total</p>
            <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#9C1E1E] to-[#D72638] bg-clip-text text-transparent leading-tight">
              {formatCurrency(recalculatedPrice)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Plan Selector */}
      <PlanSelector
        selectedPlan={selectedPlan}
        onSelectPlan={onSelectPlan}
        plans={plans}
        panelCount={panelCount}
        cartItems={cartItems}
        onContinue={onContinue}
      />
    </div>
  );
};

export default PlanSelectionContent;
