
import React from 'react';
import { ShoppingCart, Package, Info, CreditCard, CheckCircle } from 'lucide-react';

interface CheckoutProgressProps {
  currentStep: number;
}

const CheckoutProgress: React.FC<CheckoutProgressProps> = ({ currentStep }) => {
  const steps = [
    { icon: <ShoppingCart className="h-5 w-5" />, label: "Revisão" },
    { icon: <Package className="h-5 w-5" />, label: "Plano" },
    { icon: <Info className="h-5 w-5" />, label: "Cupom" },
    { icon: <CreditCard className="h-5 w-5" />, label: "Pagamento" }
  ];

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center w-full relative">
        <div className="absolute top-1/2 h-1 w-full bg-gray-200 -z-10"></div>
        
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center">
            <div 
              className={`h-10 w-10 rounded-full flex items-center justify-center 
                ${i <= currentStep 
                  ? 'bg-indexa-purple text-white' 
                  : 'bg-gray-200 text-gray-500'}`}
            >
              {i < currentStep ? <CheckCircle className="h-5 w-5" /> : step.icon}
            </div>
            <span className="text-xs mt-1">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckoutProgress;
