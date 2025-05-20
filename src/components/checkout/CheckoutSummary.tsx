
import React from 'react';
import { motion } from 'framer-motion';
import { Plan, PlanKey } from '@/types/checkout';

interface CheckoutSummaryProps {
  cartItems: any[];
  selectedPlan: PlanKey;
  couponValid: boolean;
  couponDiscount: number;
  totalPrice: number;
  planData: Plan;
  isNavigating?: boolean;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  cartItems,
  selectedPlan,
  couponValid,
  couponDiscount,
  totalPrice,
  planData,
  isNavigating = false
}) => {
  // Placeholder implementation
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Resumo do pedido</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Quantidade de painéis:</p>
          <p className="font-medium">{cartItems.length}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Plano selecionado:</p>
          <p className="font-medium">{planData?.name || 'Nenhum plano selecionado'}</p>
        </div>
        
        {couponValid && (
          <div>
            <p className="text-sm text-gray-500">Desconto aplicado:</p>
            <p className="font-medium text-green-600">{couponDiscount}%</p>
          </div>
        )}
        
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500">Valor total:</p>
          <p className="text-xl font-bold">
            {isNavigating ? (
              <span className="inline-block w-20 h-7 bg-gray-200 animate-pulse rounded"></span>
            ) : (
              `R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;
