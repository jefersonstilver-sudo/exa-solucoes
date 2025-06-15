
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/types/cart';
import { formatCurrency } from '@/utils/formatters';

interface ModernCartSummaryProps {
  cartItems: CartItem[];
  onProceedToCheckout: () => void;
  isCheckoutLoading?: boolean;
  totalPrice: number;
}

const ModernCartSummary: React.FC<ModernCartSummaryProps> = ({
  cartItems,
  onProceedToCheckout,
  isCheckoutLoading = false,
  totalPrice
}) => {
  const itemCount = cartItems.length;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="space-y-3">
        {/* Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {itemCount} {itemCount === 1 ? 'painel' : 'painéis'}
            </span>
            <span className="font-medium">{formatCurrency(totalPrice)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span className="text-[#3C1361]">{formatCurrency(totalPrice)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={onProceedToCheckout}
            disabled={isCheckoutLoading || itemCount === 0}
            className="w-full bg-[#3C1361] hover:bg-[#3C1361]/90 text-white py-3 text-sm font-semibold rounded-lg transition-colors"
            size="lg"
          >
            {isCheckoutLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processando...
              </>
            ) : (
              'Finalizar compra'
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default ModernCartSummary;
