
import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Landmark } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  setSelectedMethod?: (method: string) => void;
  onMethodChange?: (method: string) => void;
  totalAmount: number;
  couponCode?: string;
}

const PaymentMethodSelector = ({
  selectedMethod,
  setSelectedMethod,
  onMethodChange,
  totalAmount,
  couponCode
}: PaymentMethodSelectorProps) => {
  // Use onMethodChange if provided, fallback to setSelectedMethod for backwards compatibility
  const handleMethodChange = onMethodChange || setSelectedMethod || (() => {});
  
  // 🎯 CUPOM 573040: Força R$ 0,05 sem desconto PIX adicional
  const isCupom573040 = couponCode === '573040';
  
  // Aplicar 5% de desconto para pagamentos PIX (exceto cupom 573040)
  const pixDiscount = isCupom573040 ? 0 : 0.05;
  const pixAmount = isCupom573040 ? 0.05 : totalAmount * (1 - pixDiscount);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4 border rounded-lg"
    >
      <h3 className="text-lg font-semibold">Selecione a forma de pagamento</h3>
      
      <RadioGroup
        value={selectedMethod}
        onValueChange={(value) => {
          handleMethodChange(value);
          toast.info(`Método de pagamento alterado para ${value === 'pix' ? 'PIX' : 'Cartão de Crédito'}`);
        }}
        className="space-y-4"
      >
        <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-gray-50 transition-colors">
          <RadioGroupItem value="pix" id="pix" />
          <Label htmlFor="pix" className="flex-1 flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 p-2 rounded-full">
                <Landmark className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">PIX</p>
                <p className="text-sm text-gray-500">Pagamento instantâneo com 5% de desconto</p>
              </div>
            </div>
            <div className="text-right">
              {!isCupom573040 && <p className="text-sm text-gray-500 line-through">{formatCurrency(totalAmount)}</p>}
              <p className="font-medium text-green-600">{formatCurrency(pixAmount)}</p>
            </div>
          </Label>
        </div>
        
        <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-gray-50 transition-colors">
          <RadioGroupItem value="credit_card" id="credit_card" />
          <Label htmlFor="credit_card" className="flex-1 flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 p-2 rounded-full">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Cartão de Crédito</p>
                <p className="text-sm text-gray-500">Visa, Mastercard, Elo, American Express</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatCurrency(totalAmount)}</p>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </motion.div>
  );
};

export default PaymentMethodSelector;
