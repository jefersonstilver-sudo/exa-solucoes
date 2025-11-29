import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CreditCard, Shield, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';

interface CreditCardCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  itemCount: number;
  onProceedToCheckout: () => Promise<void>;
}

const CreditCardCheckoutModal: React.FC<CreditCardCheckoutModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  itemCount,
  onProceedToCheckout
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProceed = async () => {
    setIsProcessing(true);
    try {
      await onProceedToCheckout();
    } catch (error) {
      console.error('Erro ao processar checkout:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden border-0">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl"
              >
                <CreditCard className="h-8 w-8 text-white" />
              </motion.div>
            </div>
            
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-2xl font-bold text-center mb-2"
            >
              Checkout Seguro
            </motion.h2>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-blue-100 text-center text-sm"
            >
              Pagamento processado via Mercado Pago
            </motion.p>
          </motion.div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Resumo do Pedido */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Resumo do Pedido</span>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Painéis selecionados</span>
                <span className="font-semibold text-gray-900">{itemCount}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Métodos Aceitos */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="text-xs font-medium text-gray-600 mb-3">Métodos aceitos</div>
            <div className="flex gap-3 items-center justify-center">
              {['Visa', 'Mastercard', 'Elo', 'Amex'].map((brand, idx) => (
                <motion.div
                  key={brand}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 + idx * 0.05, duration: 0.3 }}
                  className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200"
                >
                  {brand}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Botão de Ação */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Button
              onClick={handleProceed}
              disabled={isProcessing}
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Redirecionando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5" />
                  <span>Prosseguir para Checkout Seguro</span>
                </div>
              )}
            </Button>
          </motion.div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-center"
          >
            <p className="text-xs text-gray-500">
              Ao continuar, você será redirecionado para o ambiente seguro do Mercado Pago
            </p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditCardCheckoutModal;
