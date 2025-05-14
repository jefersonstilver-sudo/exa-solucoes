
import React from 'react';
import { ShoppingCart, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface CartHeaderProps {
  itemCount: number;
  onClear: () => void;
}

const CartHeader: React.FC<CartHeaderProps> = ({ itemCount, onClear }) => {
  return (
    <div className="p-5 sm:p-6 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <motion.div 
            initial={{ scale: 1 }}
            whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
            className="mr-2"
          >
            <ShoppingCart className="h-6 w-6 text-[#3C1361]" />
          </motion.div>
          <h2 className="text-xl font-semibold text-[#3C1361]">Carrinho</h2>
          {itemCount > 0 && (
            <Badge variant="outline" className="ml-2 bg-[#3C1361]/10 text-[#3C1361] border-none">
              {itemCount} {itemCount === 1 ? 'painel' : 'painéis'}
            </Badge>
          )}
        </div>
        {itemCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClear}
            className="h-8 text-gray-500 hover:text-red-600 transition-colors"
            title="Limpar carrinho"
            aria-label="Limpar carrinho"
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CartHeader;
