import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, MapPin, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CortesiaOrderSuccessModalProps {
  isOpen: boolean;
  pedidoId: string;
  buildingName?: string;
  buildingAddress?: string;
  panelCount?: number;
  onClose: () => void;
}

export const CortesiaOrderSuccessModal = ({
  isOpen,
  pedidoId,
  buildingName,
  buildingAddress,
  panelCount = 1,
  onClose
}: CortesiaOrderSuccessModalProps) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) return;

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, pedidoId]);

  const handleRedirect = () => {
    onClose();
    navigate(`/anunciante/pedido/${pedidoId}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={handleRedirect}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Success Icon */}
            <div className="flex flex-col items-center pt-8 pb-6 px-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 200, 
                  damping: 15,
                  delay: 0.2 
                }}
              >
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="absolute inset-0 bg-green-100 rounded-full blur-xl"
                  />
                  <CheckCircle 
                    className="relative w-20 h-20 text-green-600" 
                    strokeWidth={2}
                  />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl md:text-3xl font-bold text-gray-900 mt-6 text-center"
              >
                Pedido Criado com Sucesso!
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 mt-2 text-center text-sm md:text-base"
              >
                Seus painéis estão prontos para receber vídeos
              </motion.p>
            </div>

            {/* Building Info Card */}
            {(buildingName || buildingAddress) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mx-6 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="space-y-3">
                  {buildingName && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                          Prédio
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">
                          {buildingName}
                        </p>
                      </div>
                    </div>
                  )}

                  {buildingAddress && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                          Endereço
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">
                          {buildingAddress}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Monitor className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        Telas Disponíveis
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {panelCount} {panelCount === 1 ? 'tela' : 'telas'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="px-6 pb-6"
            >
              <Button
                onClick={handleRedirect}
                className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                style={{ 
                  backgroundColor: '#8B1C1C',
                  color: 'white'
                }}
              >
                Ir para Gerenciar Vídeos
              </Button>
              
              <p className="text-center text-xs text-gray-500 mt-3">
                Redirecionando em {countdown} segundo{countdown !== 1 ? 's' : ''}...
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
