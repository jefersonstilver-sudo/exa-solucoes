
import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scissors, Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useVideoTrimmer } from './useVideoTrimmer';
import { TrimmerTimeline } from './TrimmerTimeline';

interface VideoTrimmerModalProps {
  file: File;
  maxDuration: number;
  isOpen: boolean;
  onClose: () => void;
  onTrimComplete: (trimmedFile: File) => void;
}

export const VideoTrimmerModal: React.FC<VideoTrimmerModalProps> = ({
  file,
  maxDuration,
  isOpen,
  onClose,
  onTrimComplete,
}) => {
  const {
    videoRef,
    state,
    endTime,
    selectedDuration,
    setStartTime,
    togglePlay,
    seekPreview,
    trimVideo,
  } = useVideoTrimmer({ file, maxDuration });

  const handleTrim = async () => {
    try {
      const trimmedFile = await trimVideo();
      onTrimComplete(trimmedFile);
    } catch (error) {
      console.error('Erro ao cortar vídeo:', error);
    }
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-xl"
          style={{ zIndex: 99999 }}
          onClick={(e) => e.target === e.currentTarget && !state.isProcessing && onClose()}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="
              w-full h-[100dvh]
              sm:w-[95vw] sm:max-w-5xl sm:h-auto sm:max-h-[92vh]
              bg-white sm:rounded-2xl
              shadow-[0_30px_100px_-20px_rgba(0,0,0,0.6)]
              overflow-hidden flex flex-col
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C7141A]/10 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-[#C7141A]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Cortar Vídeo</h2>
                  <p className="text-xs text-slate-500">
                    Janela fixa de <span className="font-semibold text-[#C7141A]">{maxDuration}s</span> — arraste para escolher o trecho
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={state.isProcessing}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Video Preview — takes maximum space */}
            <div className="flex-1 min-h-0 flex flex-col bg-slate-950">
              <div className="flex-1 min-h-[280px] sm:min-h-[420px] flex items-center justify-center p-3 sm:p-5">
                <div
                  className="relative w-full bg-black rounded-xl overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.4)]"
                  style={{ aspectRatio: '16/9' }}
                >
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    playsInline
                    muted
                    preload="auto"
                  />

                  {/* Play overlay */}
                  {!state.isPlaying && state.isReady && (
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-2xl">
                        <Play className="w-7 h-7 sm:w-9 sm:h-9 text-slate-900 ml-1" />
                      </div>
                    </button>
                  )}

                  {/* Time badge */}
                  <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur text-white text-xs font-mono tracking-wider">
                    {formatTime(state.currentTime)}
                  </div>

                  {/* Loading overlay */}
                  {!state.isReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-white/60 animate-spin" />
                        <span className="text-sm text-white/40 font-medium">Carregando vídeo...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Play/Pause button */}
              {state.isReady && (
                <div className="flex justify-center py-3">
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all"
                  >
                    {state.isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Timeline section */}
            <div className="px-4 sm:px-6 pt-6 pb-3 bg-white flex-shrink-0 border-t border-slate-100">
              {state.isReady && (
                <TrimmerTimeline
                  duration={state.duration}
                  startTime={state.startTime}
                  endTime={endTime}
                  currentTime={state.currentTime}
                  maxDuration={maxDuration}
                  thumbnails={state.thumbnails}
                  onStartChange={setStartTime}
                  onSeek={seekPreview}
                />
              )}
            </div>

            {/* Processing progress */}
            {state.isProcessing && (
              <div className="px-4 sm:px-6 pb-3 bg-white flex-shrink-0">
                <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-[#C7141A] animate-spin" />
                    <span className="text-sm text-slate-600 font-medium">Processando vídeo...</span>
                    <span className="text-sm font-mono font-bold text-slate-700 ml-auto tabular-nums">
                      {Math.round(state.processingProgress)}%
                    </span>
                  </div>
                  <Progress value={state.processingProgress} className="h-2" />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-5 px-6 sm:px-8 py-6 border-t border-slate-100 bg-white flex-shrink-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={state.isProcessing}
                className="text-slate-500 hover:text-slate-700 flex-1 sm:flex-none sm:min-w-[140px] h-12 sm:h-11 text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleTrim}
                disabled={state.isProcessing || !state.isReady}
                className="bg-[#C7141A] hover:bg-[#B40D1A] text-white gap-2 shadow-lg shadow-red-500/25 transition-all active:scale-[0.97] flex-1 sm:flex-none sm:min-w-[180px] h-12 sm:h-11 text-sm font-semibold"
              >
                {state.isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cortando...
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    Cortar e Usar
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render via portal to escape any stacking context
  return ReactDOM.createPortal(modal, document.body);
};
