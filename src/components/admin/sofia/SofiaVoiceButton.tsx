import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneCall, Sparkles, AlertCircle } from 'lucide-react';
import { useSofia } from '@/contexts/SofiaContext';
import { supabase } from '@/integrations/supabase/client';

interface SofiaVoiceButtonProps {
  className?: string;
}

export const SofiaVoiceButton: React.FC<SofiaVoiceButtonProps> = ({ className }) => {
  const [sofiaAtiva, setSofiaAtiva] = useState<boolean | null>(null);
  const { 
    state, 
    isSpeaking, 
    error, 
    startCall, 
    endCall,
  } = useSofia();

  // Buscar configuração sofia_ativa
  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from('configuracoes_adicionais')
        .select('sofia_ativa')
        .limit(1)
        .single();
      
      setSofiaAtiva(data?.sofia_ativa ?? true);
    };
    
    fetchConfig();
    
    // Ouvir mudanças em tempo real
    const channel = supabase
      .channel('sofia-config-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'configuracoes_adicionais' }, 
        () => fetchConfig()
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Se sofia_ativa não é true (carregando ou desativado), não renderizar o botão
  if (sofiaAtiva !== true) {
    return null;
  }

  const isConnecting = state === 'initializing' || state === 'connecting';
  const isConnected = state === 'connected';
  const isError = state === 'error';

  const handleButtonClick = async () => {
    if (state === 'idle' || isError) {
      await startCall();
    } else if (isConnected) {
      await endCall();
    }
  };

  // Dynamic button size based on state
  const getButtonSize = () => {
    if (isConnected) return 72;
    if (isConnecting) return 64;
    return 56;
  };

  // Get button gradient based on state
  const getButtonGradient = () => {
    if (isConnected) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    if (isConnecting) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    if (isError) return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
  };

  // Dynamic glow based on speaking state
  const getButtonShadow = () => {
    if (isConnected) {
      const glowIntensity = isSpeaking ? 50 : 30;
      const glowOpacity = isSpeaking ? 0.6 : 0.4;
      return `0 0 ${glowIntensity}px rgba(16, 185, 129, ${glowOpacity})`;
    }
    if (isConnecting) return '0 0 30px rgba(245, 158, 11, 0.4)';
    if (isError) return '0 0 30px rgba(239, 68, 68, 0.4)';
    return '0 0 25px rgba(139, 92, 246, 0.35)';
  };

  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      {/* Fluid gradient effects on sides when connected and speaking */}
      <AnimatePresence>
        {isConnected && (
          <>
            {/* Left fluid gradient */}
            <motion.div
              className="absolute top-1/2 -left-10 w-16 h-28 rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(16, 185, 129, 0.25), transparent)',
                filter: 'blur(12px)',
              }}
              initial={{ opacity: 0, x: 10, y: '-50%' }}
              animate={{ 
                opacity: isSpeaking ? [0.3, 0.7, 0.3] : [0.2, 0.35, 0.2],
                scaleY: isSpeaking ? [1, 1.4, 1] : [1, 1.1, 1],
                x: 0,
                y: '-50%'
              }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ 
                opacity: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
                scaleY: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
              }}
            />
            
            {/* Right fluid gradient */}
            <motion.div
              className="absolute top-1/2 -right-10 w-16 h-28 rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(to left, transparent, rgba(16, 185, 129, 0.25), transparent)',
                filter: 'blur(12px)',
              }}
              initial={{ opacity: 0, x: -10, y: '-50%' }}
              animate={{ 
                opacity: isSpeaking ? [0.3, 0.7, 0.3] : [0.2, 0.35, 0.2],
                scaleY: isSpeaking ? [1, 1.4, 1] : [1, 1.1, 1],
                x: 0,
                y: '-50%'
              }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ 
                opacity: { duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.15 },
                scaleY: { duration: 0.5, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }
              }}
            />

            {/* Top fluid gradient */}
            <motion.div
              className="absolute -top-8 left-1/2 w-24 h-12 rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, transparent, rgba(16, 185, 129, 0.2), transparent)',
                filter: 'blur(10px)',
                transform: 'translateX(-50%)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: isSpeaking ? [0.2, 0.6, 0.2] : [0.15, 0.25, 0.15],
                scaleX: isSpeaking ? [1, 1.4, 1] : [1, 1.1, 1],
              }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ 
                duration: 0.7, 
                repeat: Infinity, 
                ease: 'easeInOut',
                delay: 0.1
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onClick={handleButtonClick}
        className="relative rounded-full flex items-center justify-center shadow-lg transition-colors duration-300"
        style={{
          background: getButtonGradient(),
          boxShadow: getButtonShadow(),
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          width: getButtonSize(),
          height: getButtonSize(),
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Pulse rings when connecting or speaking */}
        <AnimatePresence>
          {(isConnecting || (isConnected && isSpeaking)) && (
            <>
              {[1, 2, 3].map((ring) => (
                <motion.div
                  key={ring}
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    border: `2px solid ${isConnected ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.4)'}`,
                  }}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{
                    scale: [1, 2 + ring * 0.4],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: isSpeaking ? 1 : 1.5,
                    repeat: Infinity,
                    delay: ring * 0.25,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Breathing/pulse effect when connected but not speaking */}
        {isConnected && !isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: '2px solid rgba(16, 185, 129, 0.3)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Icon with animation */}
        <motion.div
          animate={
            isConnecting 
              ? { rotate: [0, 10, -10, 0] } 
              : isSpeaking 
                ? { scale: [1, 1.15, 1] } 
                : {}
          }
          transition={{ 
            duration: isConnecting ? 0.5 : 0.4, 
            repeat: (isConnecting || isSpeaking) ? Infinity : 0 
          }}
        >
          {isConnected ? (
            <PhoneCall className="w-7 h-7 text-white" />
          ) : isConnecting ? (
            <Phone className="w-6 h-6 text-white" />
          ) : isError ? (
            <AlertCircle className="w-6 h-6 text-white" />
          ) : (
            <Sparkles className="w-6 h-6 text-white" />
          )}
        </motion.div>

        {/* Mini audio visualizer at bottom when connected */}
        <AnimatePresence>
          {isConnected && (
            <motion.div 
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              {[...Array(7)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-white rounded-full"
                  animate={{ 
                    height: isSpeaking 
                      ? [3, 6 + Math.random() * 8, 3] 
                      : [3, 5, 3] 
                  }}
                  transition={{ 
                    duration: 0.25, 
                    repeat: Infinity, 
                    delay: i * 0.06,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Status label below button when connected */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <span className="text-[10px] font-medium text-emerald-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
              {isSpeaking ? 'Sofia falando...' : 'Ouvindo...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error tooltip */}
      <AnimatePresence>
        {isError && error && (
          <motion.div
            className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            <span className="text-[10px] font-medium text-red-300 bg-red-900/90 px-3 py-1 rounded-full border border-red-500/30">
              Toque para reconectar
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
