
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import PlanSelector from './PlanSelector';
import { Plan, PlanKey } from '@/types/checkout';
import { formatCurrency } from '@/utils/priceUtils';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
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
  const hasValidSelection = selectedPlan && cartItems.length > 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg border p-4 sm:p-6 lg:p-8"
      >
        <PlanSelector
          selectedPlan={selectedPlan}
          onSelectPlan={onSelectPlan}
          plans={plans}
          panelCount={panelCount}
          cartItems={cartItems}
        />
      </motion.div>

      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-lg border p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Cart Summary */}
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex items-center justify-center w-10 h-10 bg-[#3C1361] rounded-full">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {panelCount} {panelCount === 1 ? 'Prédio' : 'Prédios'} Selecionado{panelCount !== 1 ? 's' : ''}
              </p>
              {hasValidSelection && (
                <p className="text-sm text-gray-600">
                  Plano: {plans[selectedPlan]?.name || 'Não selecionado'}
                </p>
              )}
            </div>
          </div>

          {/* Price and Action */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {hasValidSelection && (
              <div className="text-center sm:text-right">
                <p className="text-lg font-bold text-[#3C1361]">
                  {formatCurrency(totalPrice)}
                </p>
                <p className="text-sm text-gray-600">
                  Total estimado
                </p>
              </div>
            )}

            <Button
              onClick={onContinue}
              disabled={!hasValidSelection}
              className="w-full sm:w-auto bg-[#3C1361] hover:bg-[#3C1361]/90 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {cartItems.length === 0 ? (
                'Adicione prédios ao carrinho'
              ) : !selectedPlan ? (
                'Selecione um plano'
              ) : (
                <>
                  Continuar para Cupom
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PlanSelectionContent;
