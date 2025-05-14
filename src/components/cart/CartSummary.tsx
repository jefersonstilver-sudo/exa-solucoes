
import React from 'react';
import { ArrowRight, VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils/formatters';
import { motion } from 'framer-motion';

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
    <div className="border-t p-5 sm:p-6 bg-gradient-to-b from-gray-50/50 to-gray-50/80">
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Subtotal</span>
          <span className="text-sm font-medium">
            {formatCurrency(subtotal)}
          </span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-green-600 items-center">
            <span className="text-sm">Desconto</span>
            <span className="text-sm font-medium">
              - {formatCurrency(discount)}
            </span>
          </div>
        )}
        
        <Separator className="my-3" />
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Total</span>
          <motion.span 
            className="text-lg font-bold text-[#3C1361]"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {formatCurrency(total)}
          </motion.span>
        </div>
      </div>
      
      <div className="bg-[#3C1361]/5 rounded-lg p-3 mb-4 flex items-center">
        <VideoIcon className="text-[#3C1361] h-4 w-4 mr-2 flex-shrink-0" />
        <p className="text-xs text-[#3C1361]/80">
          <span className="font-medium">Ganhe 1 vídeo por mês</span> com a Indexa Produtora!
        </p>
      </div>
      
      <Button
        className={`w-full rounded-lg py-6 transition-all duration-300 ${
          isEmpty 
            ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
            : 'bg-[#3C1361] hover:bg-[#00FFAB] hover:text-[#3C1361] text-white'
        }`}
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
        *Preços incluem taxas e impostos.
      </p>
    </div>
  );
};

export default CartSummary;
