
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SuccessAnimation } from './SuccessAnimation';

interface VideoActivationSuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  videoName?: string;
  isMasterApproved?: boolean;
  isBaseActivated?: boolean;
}

export const VideoActivationSuccessPopup: React.FC<VideoActivationSuccessPopupProps> = ({
  isOpen,
  onClose,
  videoName = "Seu vídeo",
  isMasterApproved = false,
  isBaseActivated = false
}) => {
  // Determine messaging based on master status
  const title = isMasterApproved
    ? (isBaseActivated ? '⚡ Vídeo Ativo!' : '✅ Vídeo Aprovado!')
    : '🎉 Vídeo Enviado!';

  const subtitle = isMasterApproved
    ? (isBaseActivated
      ? `${videoName} foi aprovado e já está em exibição`
      : `${videoName} foi aprovado automaticamente`)
    : `${videoName} foi enviado para aprovação`;

  const infoIcon = isMasterApproved ? Zap : Clock;
  const infoTitle = isMasterApproved
    ? (isBaseActivated ? 'Em Exibição' : 'Aprovado Automaticamente')
    : 'Em Análise';
  const infoDescription = isMasterApproved
    ? (isBaseActivated
      ? 'Seu vídeo já está ativo e sendo exibido nos painéis selecionados.'
      : 'Seu vídeo foi aprovado automaticamente. Você pode defini-lo como principal na área de vídeos.')
    : <>Seu vídeo foi enviado e será analisado pela nossa equipe.{' '}
        <span className="font-bold text-amber-600">Em breve estará disponível!</span>
      </>;
  const infoBg = isMasterApproved
    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
    : 'bg-gradient-to-r from-blue-50 to-amber-50 border-amber-100';
  const infoIconColor = isMasterApproved ? 'text-green-600' : 'text-amber-600';

  const bottomText = isMasterApproved
    ? (isBaseActivated ? 'Vídeo ativo e sincronizado com os painéis' : 'Pedido Master — aprovação automática')
    : 'Você será notificado quando for aprovado';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.2, bounce: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 max-w-md w-full mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <SuccessAnimation isVisible={isOpen} />

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-3 right-3 h-8 w-8 rounded-full hover:bg-gray-100 p-0 transition-colors duration-150"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.05, type: "spring", stiffness: 300, damping: 20 }}
                  className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="h-7 w-7 text-green-600 fill-current" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {title}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {subtitle}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.2 }}
                  className={`rounded-xl p-5 border ${infoBg}`}
                >
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    {React.createElement(infoIcon, { className: `h-5 w-5 ${infoIconColor}` })}
                    <span className="font-semibold text-gray-900">{infoTitle}</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {infoDescription}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.2 }}
                  className="flex items-center justify-center space-x-2 text-sm text-gray-500"
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{bottomText}</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.2 }}
                >
                  <Button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl py-3 font-medium transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Entendi! ✅
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
