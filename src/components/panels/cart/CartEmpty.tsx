
import React from 'react';
import { ShoppingCart } from 'lucide-react';

const CartEmpty = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 rounded-full bg-muted p-3">
        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">Seu carrinho está vazio</h3>
      <p className="mb-4 text-sm text-muted-foreground px-6">
        Explore os painéis disponíveis e adicione-os ao carrinho para continuar.
      </p>
    </div>
  );
};

export default CartEmpty;
