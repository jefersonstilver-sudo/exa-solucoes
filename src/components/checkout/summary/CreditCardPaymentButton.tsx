
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface CreditCardPaymentButtonProps {
  totalAmount: number;
  onPaymentInitiate: () => Promise<void>;
  disabled?: boolean;
}

const CreditCardPaymentButton: React.FC<CreditCardPaymentButtonProps> = ({
  totalAmount,
  onPaymentInitiate,
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCardPayment = async () => {
    setIsProcessing(true);
    
    try {
      console.log('💳 Iniciando pagamento com cartão de crédito:', {
        amount: totalAmount,
        timestamp: new Date().toISOString()
      });
      
      await onPaymentInitiate();
      
      toast.success('Redirecionando para checkout...', {
        description: 'Você será levado para o MercadoPago'
      });
      
    } catch (error: any) {
      console.error('Erro no pagamento com cartão:', error);
      toast.error('Erro ao processar pagamento', {
        description: error.message || 'Tente novamente em alguns instantes'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={handleCardPayment}
          disabled={disabled || isProcessing}
          className="w-full h-16 text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg border-0 relative overflow-hidden"
        >
          <div className="flex items-center justify-center space-x-3">
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <CreditCard className="h-6 w-6" />
            )}
            <div className="flex flex-col items-start">
              <span>
                {isProcessing ? 'Processando...' : 'Pagar com Cartão'}
              </span>
              <span className="text-sm font-normal opacity-90">
                {isProcessing ? 'Redirecionando...' : `${formatCurrency(totalAmount)} - Parcelamento disponível`}
              </span>
            </div>
          </div>
          
          {!isProcessing && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          )}
        </Button>
      </motion.div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">Pagamento Seguro com Cartão</div>
            <ul className="space-y-1 text-blue-700">
              <li>• Aceita Visa, Mastercard, Elo e mais</li>
              <li>• Parcelamento em até 12x sem juros</li>
              <li>• Processamento via MercadoPago</li>
              <li>• Ambiente 100% seguro e criptografado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditCardPaymentButton;
