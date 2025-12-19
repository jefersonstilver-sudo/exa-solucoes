import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneCall, PhoneOff, Sparkles, X, Mic, Volume2 } from 'lucide-react';
import { useSofia } from '@/contexts/SofiaContext';

interface SofiaVoiceButtonProps {
  className?: string;
}

export const SofiaVoiceButton: React.FC<SofiaVoiceButtonProps> = ({ className }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { 
    state, 
    isSpeaking, 
    transcript, 
    userTranscript, 
    error, 
    pageContext,
    startCall, 
    endCall 
  } = useSofia();

  const isConnecting = state === 'initializing' || state === 'connecting';
  const isConnected = state === 'connected';

  const handleButtonClick = async () => {
    if (state === 'idle') {
      // Start call - show modal immediately with "calling" animation
      setIsModalOpen(true);
      await startCall();
    } else {
      setIsModalOpen(!isModalOpen);
    }
  };

  const handleEndCall = async () => {
    await endCall();
    setIsModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={handleButtonClick}
        className={`fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${className}`}
        style={{
          background: isConnected 
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : isConnecting
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          boxShadow: isConnected
            ? '0 0 30px rgba(16, 185, 129, 0.4)'
            : isConnecting
            ? '0 0 30px rgba(245, 158, 11, 0.4)'
            : '0 0 30px rgba(139, 92, 246, 0.4)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Pulse rings when connecting or speaking */}
        <AnimatePresence>
          {(isConnecting || isSpeaking) && (
            <>
              {[1, 2, 3].map((ring) => (
                <motion.div
                  key={ring}
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: `2px solid ${isConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                  }}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{
                    scale: [1, 2 + ring * 0.3],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: ring * 0.3,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Icon */}
        <motion.div
          animate={isConnecting ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.5, repeat: isConnecting ? Infinity : 0 }}
        >
          {isConnected ? (
            <PhoneCall className="w-6 h-6 text-white" />
          ) : isConnecting ? (
            <Phone className="w-6 h-6 text-white" />
          ) : (
            <Sparkles className="w-6 h-6 text-white" />
          )}
        </motion.div>
      </motion.button>

      {/* Call Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md"
            >
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 shadow-2xl">
                {/* Header Gradient */}
                <div className={`absolute inset-x-0 top-0 h-32 ${
                  isConnected 
                    ? 'bg-gradient-to-b from-emerald-600/20 to-transparent'
                    : isConnecting
                    ? 'bg-gradient-to-b from-amber-600/20 to-transparent'
                    : 'bg-gradient-to-b from-violet-600/20 to-transparent'
                }`} />

                {/* Close Button */}
                <button
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* Content */}
                <div className="relative px-6 py-8 flex flex-col items-center">
                  {/* Avatar with Animation */}
                  <div className="relative mb-6">
                    {/* Animated rings */}
                    <AnimatePresence>
                      {(isConnecting || isSpeaking) && (
                        <>
                          {[1, 2, 3].map((ring) => (
                            <motion.div
                              key={ring}
                              className={`absolute inset-0 rounded-full border-2 ${
                                isConnected ? 'border-emerald-400/30' : 'border-amber-400/30'
                              }`}
                              initial={{ scale: 1, opacity: 0.5 }}
                              animate={{
                                scale: [1, 1.5 + ring * 0.3],
                                opacity: [0.5, 0],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: ring * 0.3,
                                ease: 'easeOut',
                              }}
                            />
                          ))}
                        </>
                      )}
                    </AnimatePresence>

                    {/* Avatar */}
                    <motion.div
                      className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-lg ${
                        isConnected
                          ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 shadow-emerald-500/30'
                          : isConnecting
                          ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 shadow-amber-500/30'
                          : 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-purple-500/30'
                      }`}
                      animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
                    >
                      <div className="absolute inset-1 rounded-full bg-slate-900 flex items-center justify-center">
                        {isConnecting ? (
                          <Phone className="w-12 h-12 text-amber-400" />
                        ) : isConnected ? (
                          <PhoneCall className="w-12 h-12 text-emerald-400" />
                        ) : (
                          <Sparkles className="w-12 h-12 text-violet-400" />
                        )}
                      </div>
                    </motion.div>

                    {/* Status Indicator */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900 ${
                        isConnected
                          ? 'bg-green-500'
                          : isConnecting
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-gray-500'
                      }`}
                    />
                  </div>

                  {/* Name & Status */}
                  <h2 className="text-2xl font-bold text-white mb-1">Sofia</h2>
                  <p className={`text-sm mb-2 ${
                    isConnected ? 'text-emerald-300/80' : 'text-violet-300/80'
                  }`}>
                    {isConnecting
                      ? 'Conectando...'
                      : isConnected
                      ? isSpeaking
                        ? 'Falando...'
                        : 'Ouvindo...'
                      : 'IA Assistente'}
                  </p>
                  
                  {/* Page Context Badge */}
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                    <p className="text-xs text-slate-400">
                      📍 {pageContext.section}
                    </p>
                  </div>

                  {/* Audio Visualizer */}
                  {isConnected && (
                    <div className="w-full mb-6">
                      <div className="flex items-center justify-center gap-1 h-12">
                        {[...Array(20)].map((_, i) => (
                          <motion.div
                            key={i}
                            className={`w-1 rounded-full ${
                              isSpeaking ? 'bg-emerald-400' : 'bg-emerald-600/50'
                            }`}
                            animate={{
                              height: isSpeaking
                                ? [8, Math.random() * 40 + 8, 8]
                                : [8, Math.random() * 16 + 8, 8],
                            }}
                            transition={{
                              duration: 0.4,
                              repeat: Infinity,
                              delay: i * 0.05,
                              ease: 'easeInOut',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Connecting Animation */}
                  {isConnecting && (
                    <div className="w-full mb-6 flex flex-col items-center">
                      <motion.div
                        className="flex gap-2 mb-4"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {[1, 2, 3].map((dot) => (
                          <motion.div
                            key={dot}
                            className="w-3 h-3 rounded-full bg-amber-400"
                            animate={{ y: [0, -10, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: dot * 0.1,
                            }}
                          />
                        ))}
                      </motion.div>
                      <p className="text-sm text-amber-300/80">Estabelecendo conexão...</p>
                    </div>
                  )}

                  {/* Transcripts */}
                  {isConnected && (userTranscript || transcript) && (
                    <div className="w-full space-y-3 mb-6 max-h-32 overflow-y-auto">
                      {userTranscript && (
                        <div className="flex items-start gap-2">
                          <Mic className="w-4 h-4 text-blue-400 mt-1 shrink-0" />
                          <p className="text-sm text-blue-300">{userTranscript}</p>
                        </div>
                      )}
                      {transcript && (
                        <div className="flex items-start gap-2">
                          <Volume2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                          <p className="text-sm text-emerald-300">{transcript}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="w-full mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                      <p className="text-sm text-red-300 text-center">{error}</p>
                    </div>
                  )}

                  {/* End Call Button */}
                  {isConnected && (
                    <motion.button
                      onClick={handleEndCall}
                      className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <PhoneOff className="w-7 h-7 text-white" />
                    </motion.button>
                  )}

                  {/* Instructions */}
                  <p className="text-xs text-slate-400 mt-6 text-center">
                    {isConnected
                      ? 'Fale naturalmente. Sofia sabe que você está na seção ' + pageContext.section
                      : isConnecting
                      ? 'Aguarde enquanto conectamos você à Sofia...'
                      : 'Iniciando chamada...'}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SofiaVoiceButton;
