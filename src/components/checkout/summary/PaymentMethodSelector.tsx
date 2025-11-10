
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Smartphone, Check, Shield, Zap, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentMethodSelectorProps {
  selectedMethod: 'pix' | 'credit_card';
  onMethodChange: (method: 'pix' | 'credit_card') => void;
  totalAmount: number;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  totalAmount
}) => {
  // SEM desconto PIX - mesmo valor para ambos métodos
  const finalAmount = totalAmount;

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
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'pix' ? 'border-green-600' : 'border-gray-300'}`}>
                {selectedMethod === 'pix' && <div className="w-2 h-2 bg-green-600 rounded-full" />}
              </div>
              <div>
                <p className="font-medium text-gray-900">PIX</p>
                <p className="text-xs text-green-600 font-semibold">Aprovação instantânea</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalAmount)}
              </p>
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
