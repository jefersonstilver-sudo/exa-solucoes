
import React from 'react';
import { ShoppingCart, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CartHeaderProps {
  itemCount: number;
  onClear: () => void;
}

const CartHeader: React.FC<CartHeaderProps> = ({ itemCount, onClear }) => {
  return (
    <div className="p-4 sm:p-6 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ShoppingCart className="h-5 w-5 text-[#3C1361] mr-2" />
          <h2 className="text-lg font-semibold text-[#3C1361]">Carrinho</h2>
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
            className="h-8 text-gray-500 hover:text-red-600"
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
