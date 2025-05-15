
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CartDebugger from '@/components/debug/CartDebugger';
import { CART_STORAGE_KEY } from '@/services/cartStorageService';

const CartDebugButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="mr-1 h-4 w-4" />
        Debug Cart [{CART_STORAGE_KEY}]
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md p-0">
          <CartDebugger open={isOpen} onClose={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CartDebugButton;
