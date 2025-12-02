
import { useState, useEffect } from "react";
import PaymentMethodOption from "./PaymentMethodOption";
import { formatCurrency } from '@/utils/priceUtils';
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface PaymentMethodsProps {
  selectedMethod: string;
  setSelectedMethod: (method: string) => void;
  totalPrice: number;
}

const PaymentMethods = ({ selectedMethod, setSelectedMethod, totalPrice }: PaymentMethodsProps) => {
  const [pixTotal, setPixTotal] = useState<number>(totalPrice);
  
  // Allow both PIX and credit card selection
  useEffect(() => {
    console.log("[PaymentMethods] Current selected method:", selectedMethod);
  }, [selectedMethod]);
  
  // Calculate PIX discount (10% off for PIX payments)
  useEffect(() => {
    // Apply 10% discount for PIX payments
    const pixDiscount = 0.10; // 10%
    setPixTotal(totalPrice * (1 - pixDiscount));
  }, [totalPrice]);

  // Function to handle method selection
  const handleMethodSelect = async (method: string) => {
    // Set the selected method
    setSelectedMethod(method);
    
    console.log("[PaymentMethods] Setting payment method to:", method);
    
    // Log the payment method selection for analytics
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `Método de pagamento selecionado: ${method}`,
      { method, totalPrice }
    );
  };
  
  // Payment method options - Both PIX and Card available
  const paymentMethods = [
    { 
      id: "pix", 
      name: "PIX", 
      description: "Pagamento instantâneo — 5% de desconto", 
      icon: <svg 
        viewBox="0 0 512 512" 
        className="h-5 w-5" 
        fill="currentColor"
      >
        <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z"/>
      </svg>,
      installments: false,
      totalValue: pixTotal,
      highlight: true
    },
    {
      id: "credit_card",
      name: "Cartão de Crédito",
      description: "Parcele em até 12x",
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>,
      installments: true,
      totalValue: totalPrice,
      highlight: false
    }
  ];

  return (
    <div className="space-y-4">
      {paymentMethods.map((method) => (
        <PaymentMethodOption
          key={method.id}
          method={{
            ...method,
            description: method.id === 'pix' 
              ? `Pagamento instantâneo com 5% de desconto — Total: ${formatCurrency(pixTotal)}`
              : `Parcele em até 12x — Total: ${formatCurrency(totalPrice)}`
          }}
          selectedMethod={selectedMethod}
          onSelect={handleMethodSelect}
          installments={undefined}
          setInstallments={undefined}
          getInstallmentValue={undefined}
        />
      ))}
    </div>
  );
};

export default PaymentMethods;
