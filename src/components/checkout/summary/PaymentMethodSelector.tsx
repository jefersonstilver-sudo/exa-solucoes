
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
    <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-[#3C1361] to-purple-700 text-white p-6">
        <CardTitle className="flex items-center text-xl font-bold">
          <CreditCard className="h-6 w-6 mr-3" />
          Forma de Pagamento
        </CardTitle>
        <p className="text-purple-100 mt-2">
          Escolha como deseja pagar sua campanha
        </p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* PIX Option */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant={selectedMethod === 'pix' ? 'default' : 'outline'}
            className={`
              w-full p-6 h-auto text-left relative overflow-hidden
              ${selectedMethod === 'pix' 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500 shadow-lg' 
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50'
              }
            `}
            onClick={() => onMethodChange('pix')}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${selectedMethod === 'pix' ? 'bg-white/20' : 'bg-green-100'}`}>
                  <Smartphone className={`h-6 w-6 ${selectedMethod === 'pix' ? 'text-white' : 'text-green-600'}`} />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-bold">PIX</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      selectedMethod === 'pix' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-800'
                    }`}>
                      {pixDiscount}% OFF
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <Zap className="h-4 w-4 mr-1" />
                      Pagamento instantâneo
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Aprovação imediata
                    </span>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="line-through opacity-70">R$ {totalAmount.toFixed(2)}</span>
                    <span className="ml-2 font-bold text-lg">R$ {pixAmount.toFixed(2)}</span>
                  </div>
                  <div className="text-xs mt-1 opacity-80">
                    Economia de R$ {savings.toFixed(2)}
                  </div>
                </div>
              </div>
              {selectedMethod === 'pix' && (
                <div className="flex-shrink-0">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}
            </div>
          </Button>
        </motion.div>

        {/* Credit Card Option */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant={selectedMethod === 'credit_card' ? 'default' : 'outline'}
            className={`
              w-full p-6 h-auto text-left relative overflow-hidden
              ${selectedMethod === 'credit_card' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg' 
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }
            `}
            onClick={() => onMethodChange('credit_card')}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${selectedMethod === 'credit_card' ? 'bg-white/20' : 'bg-blue-100'}`}>
                  <CreditCard className={`h-6 w-6 ${selectedMethod === 'credit_card' ? 'text-white' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Cartão de Crédito</h3>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <Shield className="h-4 w-4 mr-1" />
                      Pagamento seguro
                    </span>
                    <span>Parcelamento disponível</span>
                  </div>
                  <div className="mt-2 text-lg font-bold">
                    R$ {totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
              {selectedMethod === 'credit_card' && (
                <div className="flex-shrink-0">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}
            </div>
          </Button>
        </motion.div>

        {/* Security Notice */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            <Shield className="h-4 w-4 mr-2 text-green-600" />
            <span>Pagamento 100% seguro e criptografado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodSelector;
