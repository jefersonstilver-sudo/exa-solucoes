
import React from 'react';
import { ArrowRight, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CartActionsProps {
  onCheckout: () => void;
  onClear: () => void;
  isSubmitting: boolean;
}

const CartActions: React.FC<CartActionsProps> = ({ onCheckout, onClear, isSubmitting }) => {
  return (
    <>
      <Button 
        className="w-full bg-indexa-mint hover:bg-indexa-mint-dark text-gray-800 transition-all hover:scale-105 duration-200"
        onClick={onCheckout}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Processando...
          </>
        ) : (
          <>
            Finalizar Compra <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      <Button 
        variant="outline" 
        className="w-full hover:border-red-500 hover:text-red-500 transition-all" 
        onClick={onClear}
        disabled={isSubmitting}
      >
        <Trash className="mr-2 h-4 w-4" />
        Limpar Carrinho
      </Button>
    </>
  );
};

export default CartActions;
