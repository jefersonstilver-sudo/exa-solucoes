import { useState, useEffect } from "react";
import PaymentMethodOption from "./PaymentMethodOption";
import { CreditCard } from "lucide-react";
import { formatCurrency } from '@/utils/priceUtils';

interface PaymentMethodsProps {
  selectedMethod: string;
  setSelectedMethod: (method: string) => void;
  totalPrice: number;
}

const PaymentMethods = ({ selectedMethod, setSelectedMethod, totalPrice }: PaymentMethodsProps) => {
  const [installments, setInstallments] = useState<number>(1);
  const [pixTotal, setPixTotal] = useState<number>(totalPrice);
  const [cardTotal, setCardTotal] = useState<number>(totalPrice);
  
  // CRITICAL FIX: Ensure payment method is properly initialized
  useEffect(() => {
    // Log the current payment method for debugging
    console.log("[PaymentMethods] Current selected method:", selectedMethod);
    
    // If no method is selected, default to credit_card
    if (!selectedMethod) {
      console.log("[PaymentMethods] No method selected, defaulting to credit_card");
      setSelectedMethod('credit_card');
    }
  }, [selectedMethod, setSelectedMethod]);
  
  // Calculate PIX discount (5% off for PIX payments)
  useEffect(() => {
    // Apply 5% discount for PIX payments
    const pixDiscount = 0.05; // 5%
    setPixTotal(totalPrice * (1 - pixDiscount));
    
    // For credit card, keep the original price
    setCardTotal(totalPrice);
  }, [totalPrice]);
  
  // Payment method options
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
      name: "Cartão de crédito", 
      description: "Visa, Mastercard, AMEX, ELO", 
      icon: <CreditCard className="h-5 w-5" />,
      installments: true,
      totalValue: cardTotal
    }
  ];

  // Calculate installment amount
  const getInstallmentValue = (installment: number) => {
    // Apply interest rates based on number of installments
    const interestRates: Record<number, number> = {
      1: 0,    // No interest for 1 installment
      2: 0,    // No interest for 2 installments
      3: 0,    // No interest for 3 installments
      4: 0.01, // 1% for 4 installments
      5: 0.01, // 1% for 5 installments
      6: 0.015,// 1.5% for 6 installments
      7: 0.02, // 2% for 7+ installments
      8: 0.02,
      9: 0.025,
      10: 0.025,
      11: 0.03,
      12: 0.03
    };

    const rate = interestRates[installment] || 0.03;
    
    // Para a primeira parcela, retornamos o valor total (método de pagamento específico)
    if (installment === 1) {
      return cardTotal;
    }
    
    // Apply compound interest formula: P(1 + r)^n
    const finalAmount = cardTotal * Math.pow(1 + rate, installment);
    
    // Display total on installment selector
    const installmentValue = finalAmount / installment;
    
    // Return the installment value with compound interest
    return installmentValue;
  };

  // Calcular valor total a ser pago com cartão de crédito (com juros)
  const getTotalWithInterest = (installment: number) => {
    if (installment === 1) return cardTotal;
    
    const interestRates: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0.01, 5: 0.01, 6: 0.015,
      7: 0.02, 8: 0.02, 9: 0.025, 10: 0.025, 11: 0.03, 12: 0.03
    };
    
    const rate = interestRates[installment] || 0.03;
    return cardTotal * Math.pow(1 + rate, installment);
  };

  return (
    <div className="space-y-4">
      {paymentMethods.map((method) => (
        <PaymentMethodOption
          key={method.id}
          method={{
            ...method,
            description: method.id === "pix" 
              ? `Pagamento instantâneo com 5% de desconto — Total: ${formatCurrency(pixTotal)}` 
              : `Visa, Mastercard, AMEX, ELO — Total: ${formatCurrency(getTotalWithInterest(installments))}`
          }}
          selectedMethod={selectedMethod}
          onSelect={(method) => {
            console.log("[PaymentMethods] Setting payment method to:", method);
            setSelectedMethod(method);
          }}
          installments={installments}
          setInstallments={method.installments ? setInstallments : undefined}
          getInstallmentValue={method.installments ? getInstallmentValue : undefined}
        />
      ))}
    </div>
  );
};

export default PaymentMethods;
