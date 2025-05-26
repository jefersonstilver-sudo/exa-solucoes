
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/types/cart';
import { useUserSession } from '@/hooks/useUserSession';

interface ModernCartSummaryProps {
  cartItems: CartItem[];
  onProceedToCheckout: () => void;
  isCheckoutLoading?: boolean;
}

const ModernCartSummary: React.FC<ModernCartSummaryProps> = ({
  cartItems,
  onProceedToCheckout,
  isCheckoutLoading = false
}) => {
  const { isLoggedIn } = useUserSession();
  
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
  const totalItems = cartItems.length;

  const getButtonText = () => {
    if (isCheckoutLoading) {
      return "Redirecionando...";
    }
    if (!isLoggedIn) {
      return "Fazer Login para Continuar";
    }
    return "Ir para Seleção de Plano";
  };

  const getButtonIcon = () => {
    if (isCheckoutLoading) {
      return <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />;
    }
    if (!isLoggedIn) {
      return <ArrowRight className="h-4 w-4" />;
    }
    return <ShoppingBag className="h-4 w-4" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky bottom-0 bg-white border-t border-gray-100 p-4 sm:p-6"
    >
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            {totalItems} {totalItems === 1 ? 'item' : 'itens'}
          </span>
          <span className="font-semibold text-lg text-gray-900">
            R$ {totalPrice.toFixed(2)}
          </span>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={onProceedToCheckout}
          disabled={cartItems.length === 0 || isCheckoutLoading}
          className="w-full bg-[#3C1361] hover:bg-[#3C1361]/90 text-white py-3 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <span className="flex items-center justify-center">
            {getButtonText()}
            {getButtonIcon()}
          </span>
        </Button>
      </div>
    </motion.div>
  );
};

export default ModernCartSummary;
