
import React from 'react';
import { motion } from 'framer-motion';
import PlanSelector from './PlanSelector';
import PlanContinueButton from './PlanContinueButton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Calculator } from 'lucide-react';
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
    <div className="space-y-6 sm:space-y-8">
      {/* Cart Summary - usando preço recalculado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border p-4 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#3C1361]" />
            <h3 className="text-lg font-semibold text-gray-900">Resumo do Carrinho</h3>
          </div>
          <Badge variant="secondary" className="bg-[#3C1361]/10 text-[#3C1361]">
            {panelCount} {panelCount === 1 ? 'prédio' : 'prédios'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Prédios Selecionados</div>
            <div className="text-xl font-bold text-gray-900">{panelCount}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Plano Escolhido</div>
            <div className="text-xl font-bold text-gray-900">
              {selectedPlan} {selectedPlan === 1 ? 'mês' : 'meses'}
            </div>
          </div>
          <div className="bg-[#3C1361]/5 rounded-lg p-3">
            <div className="text-sm text-[#3C1361]/70">Total Estimado</div>
            <div className="text-xl font-bold text-[#3C1361]">
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
        className="bg-white rounded-xl shadow-lg border p-4 sm:p-6"
      >
        <PlanSelector
          selectedPlan={selectedPlan}
          onSelectPlan={onSelectPlan}
          plans={plans}
          panelCount={panelCount}
          cartItems={cartItems}
        />
      </motion.div>

      {/* Price Summary Footer - usando preço recalculado */}
      {selectedPlan && panelCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-[#3C1361]/5 border-[#3C1361]/20 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-[#3C1361]" />
                  <h3 className="text-lg font-semibold text-gray-900">Resumo do Investimento</h3>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {panelCount} {panelCount === 1 ? 'prédio' : 'prédios'} × {selectedPlan} {selectedPlan === 1 ? 'mês' : 'meses'}
                  </span>
                  <span className="font-medium">{formatCurrency(recalculatedPrice)}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-[#3C1361]">
                      {formatCurrency(recalculatedPrice)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <PlanContinueButton 
                  onContinue={onContinue}
                  selectedPlan={selectedPlan}
                  panelCount={panelCount}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default PlanSelectionContent;
