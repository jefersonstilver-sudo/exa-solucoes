import React from 'react';
import { motion } from 'framer-motion';
import exaLogo from '@/assets/exa-logo.png';

interface ProfessionalLoadingAnimationProps {
  message?: string;
}

const ProfessionalLoadingAnimation: React.FC<ProfessionalLoadingAnimationProps> = ({ 
  message = "Carregando..." 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center space-y-6">
        {/* Logo animado */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <img 
            src={exaLogo} 
            alt="EXA" 
            className="h-16 w-auto"
          />
          
          {/* Círculo de loading ao redor do logo */}
          <motion.div
            className="absolute inset-0 -m-3"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="70 200"
                className="text-exa-red opacity-50"
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Mensagem */}
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-medium text-foreground/70"
          >
            {message}
          </motion.p>
        )}

        {/* Barra de progresso animada */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-exa-red"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfessionalLoadingAnimation;
