
import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface PaymentMethodProps {
  method: {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    installments: boolean;
  };
  selectedMethod: string;
  onSelect: (method: string) => void;
  installments?: number;
  setInstallments?: (value: number) => void;
  getInstallmentValue?: (installment: number) => number;
}

const PaymentMethodOption = ({ 
  method, 
  selectedMethod, 
  onSelect,
  installments,
  setInstallments,
  getInstallmentValue
}: PaymentMethodProps) => {
  return (
    <div key={method.id}>
      <label 
        htmlFor={method.id} 
        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200
          ${selectedMethod === method.id 
            ? "border-indexa-purple bg-indexa-purple/5" 
            : "border-gray-200 hover:bg-gray-50"}`}
      >
        <input
          type="radio"
          id={method.id}
          name="payment_method"
          value={method.id}
          checked={selectedMethod === method.id}
          onChange={() => onSelect(method.id)}
          className="sr-only"
          data-testid={`payment-method-${method.id}`}
        />
        <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3
          ${selectedMethod === method.id 
            ? "border-indexa-purple" 
            : "border-gray-300"}`}
        >
          {selectedMethod === method.id && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-indexa-purple w-3 h-3 rounded-full"
            />
          )}
        </div>
        
        <div className="mr-3 p-2 text-indexa-purple rounded-md bg-indexa-purple/10">
          {method.icon}
        </div>
        
        <div className="flex-grow">
          <p className="font-medium">{method.name}</p>
          <p className="text-sm text-muted-foreground">{method.description}</p>
        </div>
        
        {selectedMethod === method.id && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Check className="text-indexa-purple h-5 w-5" />
          </motion.div>
        )}
      </label>
      
      {/* Installment options for credit card */}
      {selectedMethod === method.id && method.installments && installments !== undefined && setInstallments && getInstallmentValue && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="ml-10 mt-3 mb-2 pl-4 border-l-2 border-indexa-purple/30"
        >
          <div className="space-y-2">
            <label htmlFor="installments" className="text-sm">
              Número de parcelas
            </label>
            <select
              id="installments"
              value={installments}
              onChange={(e) => setInstallments(parseInt(e.target.value))}
              className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indexa-purple focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}x {num === 1 ? "à vista" : `de R$ ${getInstallmentValue(num).toFixed(2)}`}
                  {num > 3 && " (com juros)"}
                </option>
              ))}
            </select>
            
            {installments > 1 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500 mt-1"
              >
                Total com juros: R$ {(getInstallmentValue(installments) * installments).toFixed(2)}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PaymentMethodOption;
