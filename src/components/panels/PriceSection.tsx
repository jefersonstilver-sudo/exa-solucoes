
import React from 'react';
import { CheckCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel } from '@/types/panel';

interface PriceSectionProps {
  price: number;
  price60?: number;
  price90?: number;
  inCart: boolean;
  panel: Panel;
  onAddToCart: (panel: Panel, duration: number) => void;
}

export const PriceSection: React.FC<PriceSectionProps> = ({
  price,
  price60,
  price90,
  inCart,
  panel,
  onAddToCart
}) => {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Animation variants
  const buttonVariants = {
    initial: { scale: 1 },
    added: { scale: [1, 1.1, 1], transition: { duration: 0.3 } },
    hover: { scale: 1.05, transition: { duration: 0.2 } }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-gray-100">
      <div className="mb-4 sm:mb-0 flex flex-col">
        <p className="text-sm text-gray-500 mb-1">Preço por período:</p>
        <div className="flex gap-3 items-center">
          <p className="text-2xl font-bold text-indexa-purple">{formatCurrency(price)}</p>
          <span className="text-xs bg-indexa-purple/10 text-indexa-purple px-2 py-1 rounded-full">30 dias</span>
        </div>
        {price60 && price90 && (
          <div className="text-xs text-gray-500 mt-1 flex gap-4">
            <span>60 dias: {formatCurrency(price60)}</span>
            <span>90 dias: {formatCurrency(price90)}</span>
          </div>
        )}
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={inCart ? "added" : "add"}
          variants={buttonVariants}
          initial="initial"
          animate={inCart ? "added" : "initial"}
          whileHover="hover"
          className="relative"
        >
          <Button 
            className={`transition-all text-base px-6 py-2 rounded-full shadow-md ${
              inCart
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-[#58E3AB] hover:bg-[#4AD399] text-gray-800'
            }`}
            onClick={() => !inCart && onAddToCart(panel, 30)}
            disabled={inCart}
          >
            {inCart ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Adicionado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Adicionar ao carrinho</span>
              </div>
            )}
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
