
import React from 'react';
import { motion } from 'framer-motion';
import PlanSelector from './PlanSelector';
import PlanContinueButton from './PlanContinueButton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, DollarSign, Monitor } from 'lucide-react';
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

  // Calcular número total de telas
  const totalTelas = React.useMemo(() => {
    return cartItems.reduce((total, item) => {
      const numeroElevadores = item.panel.buildings?.numero_elevadores || 0;
      const quantidadeTelas = item.panel.buildings?.quantidade_telas || 0;
      const telas = numeroElevadores > 0 ? numeroElevadores : (quantidadeTelas || 1);
      return total + telas;
    }, 0);
  }, [cartItems]);

  // Calcular número total de exibições (média de 245 por painel por dia * 30 dias)
  const totalExibicoesMes = React.useMemo(() => {
    return panelCount * 245 * 30;
  }, [panelCount]);

  return (
    <div className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
      {/* Cart Summary - Minimalista */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm"
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6">
          {/* Buildings */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#9C1E1E]/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#9C1E1E]" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Prédios</p>
              <p className="text-2xl font-bold text-gray-900">{panelCount}</p>
            </div>
          </div>

          {/* Telas */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#9C1E1E]/10 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-[#9C1E1E]" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Telas</p>
              <p className="text-2xl font-bold text-gray-900">{totalTelas}</p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#9C1E1E]/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#9C1E1E]" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Duração</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedPlan ? plans[selectedPlan].months : 0}
                <span className="text-sm font-normal text-gray-600 ml-1">
                  {selectedPlan && plans[selectedPlan].months === 1 ? 'mês' : 'meses'}
                </span>
              </p>
            </div>
          </div>

          {/* Exibições */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#9C1E1E]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#9C1E1E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Exibições/mês</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalExibicoesMes.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#9C1E1E] to-[#D72638] flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold bg-gradient-to-r from-[#9C1E1E] to-[#D72638] bg-clip-text text-transparent">
                {formatCurrency(recalculatedPrice)}
              </p>
            </div>
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
