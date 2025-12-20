import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, X, Phone, PhoneOff, Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { useSofiaClient } from '@/contexts/SofiaClientContext';
import { cn } from '@/lib/utils';

export const SofiaClientVoiceButton: React.FC = () => {
  const {
    state,
    isSpeaking,
    transcript,
    userTranscript,
    error,
    isEnabled,
    startCall,
    endCall,
  } = useSofiaClient();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Hide hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-expand when connected
  useEffect(() => {
    if (state === 'connected') {
      setIsExpanded(true);
    }
  }, [state]);

  // Log para debug - verificar se o componente está sendo renderizado
  console.log('[SofiaClientVoiceButton] isEnabled:', isEnabled);
  
  // Don't render if not enabled for this user
  if (!isEnabled) {
    console.log('[SofiaClientVoiceButton] Botão NÃO será exibido - usuário não habilitado');
    return null;
  }

  const isConnected = state === 'connected';
  const isConnecting = state === 'connecting' || state === 'initializing';

  const handleMainClick = () => {
    if (isConnected) {
      setIsExpanded(!isExpanded);
    } else if (state === 'idle' || state === 'error') {
      startCall();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Hint tooltip */}
        <AnimatePresence>
          {showHint && !isConnected && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="bg-card text-card-foreground px-3 py-2 rounded-lg shadow-lg text-sm max-w-[180px]"
            >
              <p>Olá! Sou a Sofia, posso ajudar? 🎤</p>
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-card" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded panel when connected */}
        <AnimatePresence>
          {isExpanded && isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-xl p-4 w-[300px] mb-2"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isSpeaking ? "bg-green-500 animate-pulse" : "bg-emerald-400"
                  )} />
                  <span className="font-medium text-sm">
                    {isSpeaking ? 'Sofia está falando...' : 'Ouvindo você...'}
                  </span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Transcript */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {userTranscript && (
                  <div className="bg-primary/10 rounded-lg p-2 text-sm">
                    <span className="text-muted-foreground text-xs">Você:</span>
                    <p className="text-foreground">{userTranscript}</p>
                  </div>
                )}
                {transcript && (
                  <div className="bg-secondary/50 rounded-lg p-2 text-sm">
                    <span className="text-muted-foreground text-xs">Sofia:</span>
                    <p className="text-foreground">{transcript}</p>
                  </div>
                )}
              </div>

              {/* Audio visualizer */}
              <div className="flex items-center justify-center gap-1 h-8 mt-3">
                {isSpeaking ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-primary rounded-full"
                      animate={{
                        height: [8, 20, 8],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Mic className="w-4 h-4" />
                    <span>Fale comigo...</span>
                  </div>
                )}
              </div>

              {/* End call button */}
              <button
                onClick={endCall}
                className="mt-3 w-full py-2 bg-destructive text-destructive-foreground rounded-lg flex items-center justify-center gap-2 hover:bg-destructive/90 transition-colors text-sm font-medium"
              >
                <PhoneOff className="w-4 h-4" />
                Encerrar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main floating button */}
        <motion.button
          onClick={handleMainClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
            isConnected 
              ? "bg-gradient-to-br from-emerald-500 to-teal-600"
              : isConnecting
                ? "bg-gradient-to-br from-amber-500 to-orange-600"
                : error
                  ? "bg-gradient-to-br from-red-500 to-rose-600"
                  : "bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          )}
        >
          {isConnecting ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : isConnected ? (
            <motion.div
              animate={{ scale: isSpeaking ? [1, 1.1, 1] : 1 }}
              transition={{ repeat: isSpeaking ? Infinity : 0, duration: 0.5 }}
            >
              <Volume2 className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <Headphones className="w-6 h-6 text-white" />
          )}

          {/* Pulse ring when connected */}
          {isConnected && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-emerald-400"
              animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </motion.button>
      </motion.div>
    </>
  );
};

export default SofiaClientVoiceButton;
