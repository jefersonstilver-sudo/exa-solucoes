import React from 'react';
import { motion } from 'framer-motion';

interface GlobalLoadingPageProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

const GlobalLoadingPage: React.FC<GlobalLoadingPageProps> = ({ 
  message = "Carregando...",
  showProgress = false,
  progress = 0
}) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#9C1E1E] via-[#180A0A] to-[#0B0B0B] z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Spinner elegante - apenas a bolinha com roda */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          <div className="w-16 h-16 mx-auto relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-3 border-white/20 border-t-white rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border-2 border-white/10 border-b-white/50 rounded-full"
            />
          </div>
          
          {/* Pulso de luz sutil */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-white/10 rounded-full blur-lg"
          />
        </motion.div>

        {/* Barra de progresso se habilitada */}
        {showProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 w-64 mx-auto"
          >
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <p className="text-white/80 text-sm mt-2">{Math.round(progress)}%</p>
          </motion.div>
        )}

        {/* Mensagem opcional (só mostra se message não for vazio) */}
        {message && message.trim() !== "" && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-white/90 text-sm font-medium mt-6"
          >
            {message}
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default GlobalLoadingPage;