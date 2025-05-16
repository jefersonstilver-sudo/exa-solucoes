
import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { formatCurrency } from "@/utils/priceUtils";

interface PaymentMethodProps {
  method: {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    installments?: boolean;
    totalValue: number;
  };
  selectedMethod: string;
  onSelect: (method: string) => void;
  installments?: number;
  setInstallments?: (installments: number) => void;
  getInstallmentValue?: (installments: number) => number;
}

const PaymentMethodOption = ({
  method,
  selectedMethod,
  onSelect,
  installments = 1,
  setInstallments,
  getInstallmentValue
}: PaymentMethodProps) => {
  const isSelected = selectedMethod === method.id;
  const [showInstallments, setShowInstallments] = useState(isSelected);

  const handleChange = () => {
    onSelect(method.id);
    if (method.installments) {
      setShowInstallments(true);
    }
  };

  return (
    <div className="w-full">
      <div
        onClick={handleChange}
        className={`
          relative p-4 border rounded-lg cursor-pointer transition-all duration-200
          ${isSelected 
            ? "border-[#00FFAB] ring-1 ring-[#00FFAB] bg-[#00FFAB]/5" 
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full
              ${isSelected ? "bg-[#00FFAB]/20 text-[#00FFAB]" : "bg-gray-100 text-gray-500"}
            `}>
              {method.icon}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{method.name}</h3>
              <p className="text-sm text-gray-500">{method.description}</p>
            </div>
          </div>
          <div>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00FFAB] text-white"
              >
                <Check className="h-4 w-4" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Installments dropdown - only shown for credit card when selected */}
      {method.installments && isSelected && showInstallments && setInstallments && getInstallmentValue && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <div className="space-y-2">
            <label htmlFor="installments" className="block text-sm font-medium text-gray-700">
              Número de parcelas
            </label>
            <select
              id="installments"
              value={installments}
              onChange={(e) => setInstallments(parseInt(e.target.value))}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#00FFAB] focus:border-[#00FFAB] sm:text-sm rounded-md"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                const value = getInstallmentValue(num);
                return (
                  <option key={num} value={num}>
                    {num}x {num === 1 ? 'à vista ' : ''} 
                    de {formatCurrency(value)}
                    {num > 3 ? ` (${num <= 6 ? 'juros baixos' : 'com juros'})` : ' (sem juros)'}
                  </option>
                );
              })}
            </select>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PaymentMethodOption;
