import React, { useEffect, useState } from 'react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose?: () => void;
  orderId?: string;
  clientName?: string;
  autoRedirectSeconds?: number;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  orderId,
  clientName,
  autoRedirectSeconds = 5
}) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(autoRedirectSeconds);

  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/anunciante/pedidos');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, navigate]);

  const handleGoToOrders = () => {
    navigate('/anunciante/pedidos');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
          >
            {/* Gradient top bar */}
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />

            <div className="p-8 text-center">
              {/* Animated check icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="relative mx-auto mb-6"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-emerald-400/30 blur-xl animate-pulse" />
                
                {/* Circle with check */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", damping: 12 }}
                  className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                >
                  <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    <Check className="w-10 h-10 text-white stroke-[3]" />
                  </motion.div>
                </motion.div>

                {/* Sparkles */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="absolute -bottom-1 -left-1"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-gray-900 mb-2"
              >
                Pagamento Confirmado!
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 mb-6"
              >
                {clientName ? `Obrigado, ${clientName.split(' ')[0]}!` : 'Obrigado pela confiança!'} Seu pedido foi criado com sucesso.
              </motion.p>

              {/* Order ID badge */}
              {orderId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600 mb-6"
                >
                  <span>Pedido:</span>
                  <span className="font-mono font-semibold text-gray-900">
                    #{orderId.slice(0, 8).toUpperCase()}
                  </span>
                </motion.div>
              )}

              {/* Next steps */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-emerald-50 rounded-xl p-4 mb-6 text-left text-sm space-y-2"
              >
                <p className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">📹</span>
                  <span className="text-gray-700">Envie seu vídeo (15s horizontal)</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">✅</span>
                  <span className="text-gray-700">Aguarde aprovação da equipe</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">🚀</span>
                  <span className="text-gray-700">Seu anúncio entrará no ar!</span>
                </p>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  onClick={handleGoToOrders}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300"
                >
                  <span>Acessar Meus Pedidos</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                {/* Countdown */}
                <p className="text-xs text-gray-400 mt-3">
                  Redirecionando em {countdown}s...
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
