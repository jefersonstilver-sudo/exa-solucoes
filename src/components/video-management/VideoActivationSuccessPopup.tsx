
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
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          />

          {/* Popup Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-w-md w-full mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animação de sucesso */}
              <SuccessAnimation isVisible={isOpen} />

              {/* Botão de fechar */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-gray-100 p-0"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Conteúdo principal */}
              <div className="text-center space-y-6">
                {/* Ícone de sucesso */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="h-8 w-8 text-green-600 fill-current" />
                </motion.div>

                {/* Título */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    🎉 Vídeo Selecionado!
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {videoName} foi selecionado com sucesso
                  </p>
                </motion.div>

                {/* Informação principal */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-100"
                >
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <Monitor className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">Entrando no Ar</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Seu vídeo entrará no ar nos painéis selecionados em até{' '}
                    <span className="font-bold text-blue-600">20 minutos</span>
                  </p>
                </motion.div>

                {/* Informações adicionais */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center space-x-2 text-sm text-gray-500"
                >
                  <Clock className="h-4 w-4" />
                  <span>Sincronização automática ativa</span>
                </motion.div>

                {/* Botão de ação */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl py-3 font-medium transition-all duration-200 transform hover:scale-105"
                  >
                    Perfeito! 🚀
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
