
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel } from '@/types/panel';

interface PriceSectionProps {
  price: number;
  inCart: boolean;
  panel: Panel;
  onAddToCart: (panel: Panel, duration: number) => void;
}

export const PriceSection: React.FC<PriceSectionProps> = ({
  price,
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
    added: { scale: [1, 1.1, 1], transition: { duration: 0.3 } }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-gray-100">
      <div className="mb-4 sm:mb-0">
        <p className="text-sm text-gray-500 mb-1">Preço por 30 dias:</p>
        <p className="text-2xl font-bold text-indexa-purple">{formatCurrency(price)}</p>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={inCart ? "added" : "add"}
          variants={buttonVariants}
          initial="initial"
          animate={inCart ? "added" : "initial"}
          className="relative"
        >
          <Button 
            className={`transition-all text-base px-6 py-6 rounded-full ${
              inCart
                ? 'bg-green-600 hover:bg-green-700 hover:scale-105' 
                : 'bg-[#00ffb7] hover:bg-[#00e6a5] text-gray-800 hover:scale-105 hover:shadow-lg'
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
              <span>Adicionar ao carrinho</span>
            )}
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
