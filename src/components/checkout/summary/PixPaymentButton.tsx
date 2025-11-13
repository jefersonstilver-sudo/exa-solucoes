
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Loader2, Check, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface PixPaymentButtonProps {
  totalAmount: number;
  onPaymentInitiate: () => Promise<void>;
  disabled?: boolean;
}

const PixPaymentButton: React.FC<PixPaymentButtonProps> = ({
  totalAmount,
  onPaymentInitiate,
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePixPayment = async () => {
    setIsProcessing(true);
    
    try {
      // REMOVED: n8n webhook - PIX handled by process-payment edge function
      console.log('[PixPaymentButton] Usando Mercado Pago SDK nativo');
      
      // Iniciar processo de pagamento
      await onPaymentInitiate();
      
      toast.success('Gerando QR Code PIX...', {
        description: 'Você será redirecionado para finalizar o pagamento'
      });
      
    } catch (error: any) {
      console.error('Erro no pagamento PIX:', error);
      toast.error('Erro ao processar pagamento PIX', {
        description: error.message || 'Tente novamente em alguns instantes'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2 sm:space-y-4">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Button
          onClick={handlePixPayment}
          disabled={disabled || isProcessing}
          className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm border-0"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {isProcessing ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            ) : (
              <Smartphone className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
            <div className="flex flex-col items-start">
              <span>
                {isProcessing ? 'Processando...' : 'Pagar com PIX'}
              </span>
              <span className="text-[10px] sm:text-xs font-normal opacity-90">
                {isProcessing ? 'Gerando QR Code' : `${formatCurrency(totalAmount)}`}
              </span>
            </div>
          </div>
        </Button>
      </motion.div>

      {/* Informações de Segurança - Minimalista */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3">
        <div className="flex items-start gap-2">
          <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0 mt-0.5" />
          <div className="text-[9px] sm:text-xs text-gray-700">
            <div className="font-medium mb-1">Pagamento Seguro</div>
            <ul className="space-y-0.5 text-gray-600">
              <li>• Aprovação instantânea</li>
              <li>• QR Code válido 30 min</li>
              <li>• Campanha ativa imediatamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default PixPaymentButton;
