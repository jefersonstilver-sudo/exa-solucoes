
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Smartphone, Check, Shield, Zap, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentMethodSelectorProps {
  selectedMethod: 'pix' | 'credit_card';
  onMethodChange: (method: 'pix' | 'credit_card') => void;
  totalAmount: number;
  pixDiscount?: number;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  totalAmount,
  pixDiscount = 5
}) => {
  const pixAmount = totalAmount * (1 - pixDiscount / 100);
  const savings = totalAmount - pixAmount;

  return (
    <Card className="shadow-sm border">
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-lg font-semibold">
          Forma de Pagamento
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-3">
        {/* PIX Option */}
        <button
          onClick={() => onMethodChange('pix')}
          className={`
            w-full p-3 text-left rounded-lg border-2 transition-all
            ${selectedMethod === 'pix' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-green-300'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className={`h-5 w-5 ${selectedMethod === 'pix' ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm">PIX</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                    {pixDiscount}% OFF
                  </span>
                </div>
                <p className="text-xs text-gray-600">Aprovação instantânea</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm line-through text-gray-400">R$ {totalAmount.toFixed(2)}</p>
              <p className="font-bold text-green-600">R$ {pixAmount.toFixed(2)}</p>
            </div>
          </div>
        </button>

        {/* Credit Card Option */}
        <button
          onClick={() => onMethodChange('credit_card')}
          className={`
            w-full p-3 text-left rounded-lg border-2 transition-all
            ${selectedMethod === 'credit_card' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-blue-300'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className={`h-5 w-5 ${selectedMethod === 'credit_card' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <span className="font-semibold text-sm">Cartão de Crédito</span>
                <p className="text-xs text-gray-600">Parcelamento disponível</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">R$ {totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </button>

        {/* Security Notice */}
        <div className="flex items-center text-xs text-gray-500 pt-2">
          <Shield className="h-3.5 w-3.5 mr-1.5 text-green-600" />
          <span>Pagamento 100% seguro</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodSelector;
