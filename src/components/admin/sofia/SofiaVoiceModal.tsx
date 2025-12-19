import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, PhoneOff, Mic, MicOff, Sparkles, Volume2 } from 'lucide-react';
import { useSofiaVoice } from '@/hooks/useSofiaVoice';
import { Button } from '@/components/ui/button';

interface SofiaVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SofiaVoiceModal: React.FC<SofiaVoiceModalProps> = ({ isOpen, onClose }) => {
  const {
    isConnecting,
    isConnected,
    isSpeaking,
    transcript,
    userTranscript,
    error,
    startConversation,
    endConversation,
    getInputVolume,
    getOutputVolume,
  } = useSofiaVoice();

  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);

  // Monitor audio levels
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      try {
        const input = getInputVolume?.() || 0;
        const output = getOutputVolume?.() || 0;
        setInputLevel(input);
        setOutputLevel(output);
      } catch (e) {
        // Ignore errors when not connected
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isConnected, getInputVolume, getOutputVolume]);

  const handleClose = () => {
    if (isConnected) {
      endConversation();
    }
    onClose();
  };

  const handleCallAction = () => {
    if (isConnected) {
      endConversation();
    } else {
      startConversation();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 shadow-2xl">
              {/* Header Gradient */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-violet-600/20 to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Content */}
              <div className="relative px-6 py-8 flex flex-col items-center">
                {/* Avatar with Audio Waves */}
                <div className="relative mb-6">
                  {/* Outer Glow Rings */}
                  <AnimatePresence>
                    {(isSpeaking || isConnecting) && (
                      <>
                        {[1, 2, 3].map((ring) => (
                          <motion.div
                            key={ring}
                            className="absolute inset-0 rounded-full border-2 border-violet-400/30"
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{
                              scale: [1, 1.5 + ring * 0.3],
                              opacity: [0.5, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: ring * 0.3,
                              ease: "easeOut",
                            }}
                          />
                        ))}
                      </>
                    )}
                  </AnimatePresence>

                  {/* Avatar Container */}
                  <motion.div
                    className="relative w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
                    animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <div className="absolute inset-1 rounded-full bg-slate-900 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-violet-400" />
                    </div>
                  </motion.div>

                  {/* Status Indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900 ${
                    isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'
                  }`} />
                </div>

                {/* Name */}
                <h2 className="text-2xl font-bold text-white mb-1">Sofia</h2>
                <p className="text-violet-300/80 text-sm mb-6">
                  {isConnecting ? 'Conectando...' : isConnected ? (isSpeaking ? 'Falando...' : 'Ouvindo...') : 'IA Assistente'}
                </p>

                {/* Audio Visualizer */}
                {isConnected && (
                  <div className="w-full mb-6">
                    <div className="flex items-center justify-center gap-1 h-12">
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          className={`w-1 rounded-full ${isSpeaking ? 'bg-violet-400' : 'bg-violet-600/50'}`}
                          animate={{
                            height: isSpeaking 
                              ? [8, Math.random() * 40 + 8, 8]
                              : [8, Math.random() * 16 + 8, 8],
                          }}
                          transition={{
                            duration: 0.4,
                            repeat: Infinity,
                            delay: i * 0.05,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Transcripts */}
                {isConnected && (
                  <div className="w-full space-y-3 mb-6 max-h-32 overflow-y-auto">
                    {userTranscript && (
                      <div className="flex items-start gap-2">
                        <Mic className="w-4 h-4 text-blue-400 mt-1 shrink-0" />
                        <p className="text-sm text-blue-300">{userTranscript}</p>
                      </div>
                    )}
                    {transcript && (
                      <div className="flex items-start gap-2">
                        <Volume2 className="w-4 h-4 text-violet-400 mt-1 shrink-0" />
                        <p className="text-sm text-violet-300">{transcript}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="w-full mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                    <p className="text-sm text-red-300 text-center">{error}</p>
                  </div>
                )}

                {/* Call Button */}
                <div className="flex items-center gap-4">
                  <motion.button
                    onClick={handleCallAction}
                    disabled={isConnecting}
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${isConnected 
                        ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' 
                        : 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isConnecting ? (
                      <motion.div
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : isConnected ? (
                      <PhoneOff className="w-7 h-7 text-white" />
                    ) : (
                      <Phone className="w-7 h-7 text-white" />
                    )}
                  </motion.button>
                </div>

                {/* Instructions */}
                <p className="text-xs text-slate-400 mt-6 text-center">
                  {isConnected 
                    ? 'Fale naturalmente. Sofia pode consultar dados em tempo real.'
                    : 'Toque para iniciar uma chamada com a Sofia'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SofiaVoiceModal;
