
import React, { useState } from 'react';
import { ArrowRight, VideoIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils/formatters';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useCouponValidator } from '@/hooks/useCouponValidator';

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
  const { 
    couponCode, 
    setCouponCode, 
    couponDiscount, 
    isValidatingCoupon, 
    couponMessage, 
    couponValid,
    validateCoupon 
  } = useCouponValidator();

  // Calculate total after applying coupon discount
  const totalAfterCoupon = couponValid ? 
    total * (1 - (couponDiscount / 100)) : 
    total;

  // Format the coupon discount amount
  const couponDiscountAmount = couponValid ? 
    (total * (couponDiscount / 100)) : 
    0;

  const handleApplyCoupon = async () => {
    // For simplicity, we're using 1 as the plan duration
    // In a real scenario, you might want to pass the actual selected plan
    await validateCoupon(1);
  };

  const handleCheckoutClick = (e: React.MouseEvent) => {
    console.log("CartSummary: Botão de checkout clicado");
    
    // Garantir que o evento não se propague e não cause problemas no drawer
    e.preventDefault();
    e.stopPropagation();
    
    // Chamar a função de checkout
    onCheckout();
  };

  return (
    <div className="border-t p-5 sm:p-6 bg-gradient-to-b from-gray-50/50 to-gray-50/80">
      {/* Coupon input section */}
      <div className="mb-4 bg-white p-3 rounded-xl border border-gray-100">
        <p className="text-xs text-[#3C1361] font-medium mb-2">Inserir cupom de desconto</p>
        <div className="flex items-center space-x-2">
          <Input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Digite o código"
            className="h-9 text-sm"
            disabled={isValidatingCoupon || couponValid}
          />
          <Button 
            onClick={handleApplyCoupon}
            disabled={!couponCode.trim() || isValidatingCoupon || couponValid}
            variant={couponValid ? "outline" : "default"}
            size="sm"
            className={`h-9 ${couponValid ? 'bg-green-50 text-green-600 border-green-200' : 'bg-[#3C1361] hover:bg-[#3C1361]/80'}`}
          >
            {isValidatingCoupon ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : couponValid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              "Aplicar"
            )}
          </Button>
        </div>
        
        {couponMessage && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`text-xs mt-2 ${couponValid ? 'text-green-600' : 'text-red-500'}`}
          >
            {couponMessage}
          </motion.p>
        )}
      </div>

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

        {couponValid && couponDiscount > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-between text-green-600 items-center"
          >
            <span className="text-sm flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" /> 
              Cupom ({couponDiscount}%)
            </span>
            <span className="text-sm font-medium">
              - {formatCurrency(couponDiscountAmount)}
            </span>
          </motion.div>
        )}
        
        <Separator className="my-3" />
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Total</span>
          <motion.span 
            className="text-lg font-bold text-[#3C1361]"
            initial={{ scale: 1 }}
            animate={{ scale: couponValid ? [1, 1.05, 1] : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {formatCurrency(totalAfterCoupon)}
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
        onClick={handleCheckoutClick}
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
