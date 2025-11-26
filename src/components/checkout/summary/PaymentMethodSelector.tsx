
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Smartphone, Check, Shield, Zap, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentMethodSelectorProps {
  selectedMethod: 'pix' | 'credit_card';
  onMethodChange: (method: 'pix' | 'credit_card') => void;
  totalAmount: number;
  couponCode?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  totalAmount,
  couponCode
}) => {
  // 🎯 CUPOM 573040: Força R$ 0,05 sempre
  const isCupom573040 = couponCode === '573040';
  const finalAmount = isCupom573040 ? 0.05 : totalAmount;

  return (
    <Card className="shadow-2xl border rounded-2xl">
      <CardHeader className="p-2 sm:p-4 pb-2 sm:pb-3">
        <CardTitle className="text-xs sm:text-lg font-semibold">
          Forma de Pagamento
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-2 sm:p-4 pt-0 space-y-1.5 sm:space-y-3">
        {/* PIX Option - Mobile Compacto */}
        <button
          onClick={() => onMethodChange('pix')}
          className={`
            w-full p-2 sm:p-3 text-left rounded-lg border-2 transition-all
            ${selectedMethod === 'pix' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-green-300'
            }
          `}
        >
          <div className="flex items-center justify-between gap-1.5 sm:gap-0">
            <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0 flex-1">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedMethod === 'pix' ? 'border-green-600' : 'border-gray-300'}`}>
                {selectedMethod === 'pix' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-600 rounded-full" />}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-[10px] sm:text-base">PIX</p>
                <p className="text-[9px] sm:text-xs text-green-600 font-semibold truncate">Instantâneo</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs sm:text-lg font-bold text-green-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalAmount)}
              </p>
            </div>
          </div>
        </button>

        {/* Credit Card Option - Mobile Compacto */}
        <button
          onClick={() => onMethodChange('credit_card')}
          className={`
            w-full p-2 sm:p-3 text-left rounded-lg border-2 transition-all
            ${selectedMethod === 'credit_card' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-blue-300'
            }
          `}
        >
          <div className="flex items-center justify-between gap-1.5 sm:gap-0">
            <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0 flex-1">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedMethod === 'credit_card' ? 'border-blue-600' : 'border-gray-300'}`}>
                {selectedMethod === 'credit_card' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full" />}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-[10px] sm:text-base">Cartão</p>
                <p className="text-[9px] sm:text-xs text-gray-600 truncate">Parcelamento</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs sm:text-lg font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
              </p>
            </div>
          </div>
        </button>

        {/* Security Notice */}
        <div className="flex items-center text-[9px] sm:text-xs text-gray-500 pt-1 sm:pt-2">
          <Shield className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-green-600" />
          <span>Pagamento 100% seguro</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodSelector;
