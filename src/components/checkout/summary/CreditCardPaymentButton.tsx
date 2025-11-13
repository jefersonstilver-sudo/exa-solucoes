
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
    <div className="space-y-2 sm:space-y-4">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Button
          onClick={handleCardPayment}
          disabled={disabled || isProcessing}
          className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm border-0"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {isProcessing ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
            <div className="flex flex-col items-start">
              <span>
                {isProcessing ? 'Processando...' : 'Pagar com Cartão'}
              </span>
              <span className="text-[10px] sm:text-xs font-normal opacity-90">
                {isProcessing ? 'Redirecionando...' : `${formatCurrency(totalAmount)}`}
              </span>
            </div>
          </div>
        </Button>
      </motion.div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3">
        <div className="flex items-start gap-2">
          <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0 mt-0.5" />
          <div className="text-[9px] sm:text-xs text-gray-700">
            <div className="font-medium mb-1">Pagamento Seguro</div>
            <div className="text-gray-600">
              <div>• Parcelamento disponível</div>
              <div>• Aceita Visa, Master, Elo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditCardPaymentButton;
