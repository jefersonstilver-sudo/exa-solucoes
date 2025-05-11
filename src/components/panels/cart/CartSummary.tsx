
import React from 'react';
import { Separator } from '@/components/ui/separator';

interface CartSummaryProps {
  subtotal: string;
  discount: string;
  total: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({ subtotal, discount, total }) => {
  return (
    <div className="space-y-1.5 bg-gray-50 p-3 rounded-md">
      <div className="flex justify-between text-sm">
        <span>Subtotal:</span>
        <span>{subtotal}</span>
      </div>
      
      <div className="flex justify-between text-sm text-green-600">
        <span>Desconto:</span>
        <span>- {discount}</span>
      </div>
      
      <Separator className="my-2" />
      
      <div className="flex justify-between font-semibold">
        <span>Total:</span>
        <span>{total}</span>
      </div>
    </div>
  );
};

export default CartSummary;
