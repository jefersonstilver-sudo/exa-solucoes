
import React from 'react';
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
    selectedDuration,
    setStartTime,
    setEndTime,
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-lg"
          style={{ zIndex: 99999 }}
          onClick={(e) => e.target === e.currentTarget && !state.isProcessing && onClose()}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full sm:max-w-[720px] max-h-[95dvh] sm:max-h-[92vh] bg-white sm:rounded-2xl rounded-t-2xl shadow-[0_-10px_60px_rgba(0,0,0,0.3)] sm:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white flex-shrink-0">
              {/* Mobile drag indicator */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-300 sm:hidden" />
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C7141A]/10 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-[#C7141A]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Cortar Vídeo</h2>
                  <p className="text-xs text-slate-500">
                    Selecione até <span className="font-semibold text-[#C7141A]">{maxDuration}s</span> do vídeo
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={state.isProcessing}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Video Preview */}
              <div className="px-4 sm:px-5 pt-4">
                <div
                  className="relative w-full bg-black rounded-xl overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]"
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
                      <div className="w-16 h-16 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-2xl">
                        <Play className="w-7 h-7 text-slate-900 ml-1" />
                      </div>
                    </button>
                  )}

                  {/* Current time badge */}
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

              {/* Play/Pause control */}
              {state.isReady && (
                <div className="flex justify-center py-3">
                  <button
                    onClick={togglePlay}
                    className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center transition-all"
                  >
                    {state.isPlaying ? (
                      <Pause className="w-5 h-5 text-slate-700" />
                    ) : (
                      <Play className="w-5 h-5 text-slate-700 ml-0.5" />
                    )}
                  </button>
                </div>
              )}

              {/* Timeline */}
              <div className="px-4 sm:px-5 pb-3">
                {state.isReady && (
                  <TrimmerTimeline
                    duration={state.duration}
                    startTime={state.startTime}
                    endTime={state.endTime}
                    currentTime={state.currentTime}
                    maxDuration={maxDuration}
                    thumbnails={state.thumbnails}
                    onStartChange={setStartTime}
                    onEndChange={setEndTime}
                    onSeek={seekPreview}
                  />
                )}
              </div>

              {/* Duration info */}
              <div className="px-4 sm:px-5 pb-4">
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-sm text-slate-500">Trecho:</span>
                  <span className={`text-sm font-bold tabular-nums ${
                    selectedDuration > maxDuration ? 'text-red-600' : 'text-[#C7141A]'
                  }`}>
                    {selectedDuration.toFixed(1)}s
                  </span>
                  <span className="text-sm text-slate-400">/ {maxDuration}s máx</span>
                </div>
              </div>

              {/* Processing progress */}
              {state.isProcessing && (
                <div className="px-4 sm:px-5 pb-4">
                  <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-[#C7141A] animate-spin" />
                      <span className="text-sm text-slate-600 font-medium">Processando vídeo...</span>
                      <span className="text-sm font-mono font-bold text-slate-700 ml-auto">
                        {Math.round(state.processingProgress)}%
                      </span>
                    </div>
                    <Progress value={state.processingProgress} className="h-2" />
                  </div>
                </div>
              )}
            </div>

            {/* Actions - sticky bottom */}
            <div className="flex items-center justify-between sm:justify-end gap-3 px-4 sm:px-5 py-4 border-t border-slate-100 bg-white flex-shrink-0 safe-bottom">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={state.isProcessing}
                className="text-slate-500 hover:text-slate-700 flex-1 sm:flex-none h-12 sm:h-10 text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleTrim}
                disabled={state.isProcessing || !state.isReady || selectedDuration > maxDuration}
                className="bg-[#C7141A] hover:bg-[#B40D1A] text-white gap-2 shadow-lg shadow-red-500/25 transition-all active:scale-[0.97] flex-1 sm:flex-none h-12 sm:h-10 text-sm font-semibold"
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
};
