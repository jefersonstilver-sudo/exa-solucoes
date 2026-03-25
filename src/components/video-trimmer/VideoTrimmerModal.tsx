
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
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && !state.isProcessing && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Cortar Vídeo</h2>
                  <p className="text-xs text-slate-500">
                    Selecione até {maxDuration}s do vídeo
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={state.isProcessing}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Video Preview */}
            <div className="px-5 pt-4">
              <div
                className="relative w-full bg-black rounded-xl overflow-hidden"
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
                    <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg">
                      <Play className="w-6 h-6 text-slate-900 ml-1" />
                    </div>
                  </button>
                )}

                {/* Current time badge */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur text-white text-xs font-mono">
                  {formatTime(state.currentTime)}
                </div>

                {/* Loading overlay */}
                {!state.isReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Play/Pause button */}
            {state.isReady && (
              <div className="flex justify-center py-3">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  {state.isPlaying ? (
                    <Pause className="w-4 h-4 text-slate-700" />
                  ) : (
                    <Play className="w-4 h-4 text-slate-700 ml-0.5" />
                  )}
                </button>
              </div>
            )}

            {/* Timeline */}
            <div className="px-5 pb-3">
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
            <div className="px-5 pb-4">
              <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-sm text-slate-600">Trecho selecionado:</span>
                <span className={`text-sm font-semibold ${
                  selectedDuration > maxDuration ? 'text-red-600' : 'text-[hsl(var(--primary))]'
                }`}>
                  {selectedDuration.toFixed(1)}s
                </span>
                <span className="text-sm text-slate-400">/ {maxDuration}s máx</span>
              </div>
            </div>

            {/* Processing progress */}
            {state.isProcessing && (
              <div className="px-5 pb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-[hsl(var(--primary))] animate-spin" />
                    <span className="text-sm text-slate-600">Processando vídeo...</span>
                    <span className="text-sm font-mono text-slate-500 ml-auto">
                      {Math.round(state.processingProgress)}%
                    </span>
                  </div>
                  <Progress value={state.processingProgress} className="h-1.5" />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={state.isProcessing}
                className="text-slate-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleTrim}
                disabled={state.isProcessing || !state.isReady || selectedDuration > maxDuration}
                className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white gap-2"
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
