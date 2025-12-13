import React, { useState, useEffect } from 'react';
import { FileText, Shield, CheckCircle } from 'lucide-react';

interface ContractLoadingScreenProps {
  message?: string;
  step?: number;
}

const LOADING_MESSAGES = [
  'Analisando seus dados...',
  'Verificando informações...',
  'Preparando contrato...',
  'Quase lá...'
];

export const ContractLoadingScreen: React.FC<ContractLoadingScreenProps> = ({ 
  message,
  step = 0
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Cycle through messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    return () => clearInterval(messageInterval);
  }, []);

  // Animate progress bar
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    return () => clearInterval(progressInterval);
  }, []);

  const displayMessage = message || LOADING_MESSAGES[currentMessageIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#9C1E1E] via-[#8B1A1A] to-[#7D1818]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Animated icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl shadow-black/20">
            <FileText className="h-12 w-12 text-white animate-pulse" />
          </div>
          
          {/* Floating shield icon */}
          <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg animate-bounce">
            <Shield className="h-5 w-5 text-[#9C1E1E]" />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-2 transition-all duration-500">
          {displayMessage}
        </h2>
        
        <p className="text-white/70 text-sm mb-8 max-w-xs">
          Estamos preparando tudo para você. Isso levará apenas alguns segundos.
        </p>

        {/* Progress bar */}
        <div className="w-64 h-1.5 bg-white/20 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-white/40 text-xs">
          Powered by EXA Mídia
        </p>
      </div>
    </div>
  );
};

export default ContractLoadingScreen;
