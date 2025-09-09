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
    <div className="fixed inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary-dark z-50 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Logo EXA com animação */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <div className="w-24 h-24 mx-auto mb-6 relative">
            {/* Logo placeholder - será substituída pela logo real */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-white/30 border-t-white rounded-full"
            />
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-xl">EXA</span>
            </div>
          </div>
          
          {/* Pulso de luz */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-white/20 rounded-full blur-xl"
          />
        </motion.div>

        {/* Spinner elegante */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative"
        >
          <div className="w-16 h-16 mx-auto relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-white/20 border-t-white rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border-2 border-white/10 border-b-white/50 rounded-full"
            />
          </div>
        </motion.div>

        {/* Mensagem */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-4"
        >
          <p className="text-white text-lg font-medium">{message}</p>
          
          {/* Barra de progresso se habilitada */}
          {showProgress && (
            <div className="w-64 mx-auto">
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-white rounded-full"
                />
              </div>
              <p className="text-white/80 text-sm mt-2">{Math.round(progress)}%</p>
            </div>
          )}
        </motion.div>

        {/* Partículas decorativas */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: [0, 0.3, 0]
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              className="absolute w-2 h-2 bg-white/30 rounded-full blur-sm"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GlobalLoadingPage;