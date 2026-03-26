
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Monitor, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SuccessAnimation } from './SuccessAnimation';

interface VideoActivationSuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  videoName?: string;
}

export const VideoActivationSuccessPopup: React.FC<VideoActivationSuccessPopupProps> = ({
  isOpen,
  onClose,
  videoName = "Seu vídeo"
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay otimizado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }} // Mais rápido
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          />

          {/* Popup Container otimizado */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.2, bounce: 0.25 }} // Mais responsivo
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 max-w-md w-full mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animação de sucesso */}
              <SuccessAnimation isVisible={isOpen} />

              {/* Botão de fechar otimizado */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-3 right-3 h-8 w-8 rounded-full hover:bg-gray-100 p-0 transition-colors duration-150"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Conteúdo principal */}
              <div className="text-center space-y-4">
                {/* Ícone de sucesso otimizado */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.05, type: "spring", stiffness: 300, damping: 20 }}
                  className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="h-7 w-7 text-green-600 fill-current" />
                </motion.div>

                {/* Título otimizado */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    🎉 Vídeo Enviado!
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {videoName} foi enviado para aprovação
                  </p>
                </motion.div>

                {/* Informação principal otimizada */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.2 }}
                  className="bg-gradient-to-r from-blue-50 to-amber-50 rounded-xl p-5 border border-amber-100"
                >
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span className="font-semibold text-gray-900">Em Análise</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Seu vídeo foi enviado e será analisado pela nossa equipe.{' '}
                    <span className="font-bold text-amber-600">Em breve estará disponível!</span>
                  </p>
                </motion.div>

                {/* Informações adicionais otimizadas */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.2 }}
                  className="flex items-center justify-center space-x-2 text-sm text-gray-500"
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Você será notificado quando for aprovado</span>
                </motion.div>

                {/* Botão de ação otimizado */}
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
