
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils/formatters';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  total: number;
  onCheckout: () => void;
  isSubmitting: boolean;
  isEmpty: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  discount,
  total,
  onCheckout,
  isSubmitting,
  isEmpty
}) => {
  return (
    <div className="border-t p-4 sm:p-6 bg-gray-50">
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Subtotal</span>
          <span className="text-sm font-medium">
            {formatCurrency(subtotal)}
          </span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="text-sm">Desconto</span>
            <span className="text-sm font-medium">
              - {formatCurrency(discount)}
            </span>
          </div>
        )}
        
        <Separator className="my-2" />
        
        <div className="flex justify-between">
          <span className="font-medium">Total</span>
          <span className="text-lg font-bold text-[#3C1361]">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
      
      <Button
        className="w-full bg-[#3C1361] hover:bg-[#3C1361]/90 text-white rounded-lg py-6 transition-transform hover:scale-[1.02]"
        disabled={isSubmitting || isEmpty}
        onClick={onCheckout}
      >
        {isSubmitting ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processando...
          </span>
        ) : (
          <span className="flex items-center font-medium">
            Finalizar Compra <ArrowRight className="ml-2 h-5 w-5" />
          </span>
        )}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground mt-3">
        Preços mostrados incluem impostos e taxas de processamento.
      </p>
    </div>
  );
};

export default CartSummary;
