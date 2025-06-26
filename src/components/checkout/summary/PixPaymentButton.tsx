
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
      // Configurar webhook PIX
      const webhookUrl = 'https://stilver.app.n8n.cloud/webhook/d8e707ae-093a-4e08-9069-8627eb9c1d19';
      
      console.log('🔗 Configurando webhook PIX:', webhookUrl);
      
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
    <div className="space-y-4">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={handlePixPayment}
          disabled={disabled || isProcessing}
          className="w-full h-16 text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg border-0 relative overflow-hidden"
        >
          <div className="flex items-center justify-center space-x-3">
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Smartphone className="h-6 w-6" />
            )}
            <div className="flex flex-col items-start">
              <span>
                {isProcessing ? 'Processando...' : 'Pagar com PIX'}
              </span>
              <span className="text-sm font-normal opacity-90">
                {isProcessing ? 'Gerando QR Code' : `${formatCurrency(totalAmount)} com 5% de desconto`}
              </span>
            </div>
          </div>
          
          {!isProcessing && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          )}
        </Button>
      </motion.div>

      {/* Informações de Segurança */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">
            <div className="font-medium mb-1">Pagamento 100% Seguro</div>
            <ul className="space-y-1 text-green-700">
              <li>• Aprovação instantânea após pagamento</li>
              <li>• QR Code válido por 30 minutos</li>
              <li>• Confirmação automática por webhook</li>
              <li>• Campanha ativada imediatamente</li>
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
