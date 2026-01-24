import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface VoiceRecordButtonProps {
  onTranscriptionComplete: (text: string) => void;
  onAudioUrlReady?: (url: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'floating' | 'inline';
  className?: string;
}

export function VoiceRecordButton({
  onTranscriptionComplete,
  onAudioUrlReady,
  disabled = false,
  variant = 'default',
  className,
}: VoiceRecordButtonProps) {
  const {
    isRecording,
    isTranscribing,
    formattedDuration,
    transcription,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder({
    onTranscriptionComplete,
    onAudioUrlReady,
  });

  // Floating variant - fixed position button
  if (variant === 'floating') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className={cn(
            "fixed bottom-24 right-4 z-50",
            className
          )}
        >
          {isRecording ? (
            <div className="flex items-center gap-2">
              {/* Cancel button */}
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={cancelRecording}
                className="p-3 bg-gray-200 rounded-full shadow-lg hover:bg-gray-300 transition-colors"
              >
                <MicOff className="h-5 w-5 text-gray-600" />
              </motion.button>

              {/* Recording indicator */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full shadow-lg"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-mono">{formattedDuration}</span>
              </motion.div>

              {/* Stop button */}
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={stopRecording}
                className="p-4 bg-red-600 rounded-full shadow-lg hover:bg-red-700 transition-colors"
              >
                <Square className="h-6 w-6 text-white fill-white" />
              </motion.button>
            </div>
          ) : isTranscribing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="p-4 bg-[#9C1E1E] rounded-full shadow-lg"
            >
              <Loader2 className="h-6 w-6 text-white" />
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={startRecording}
              disabled={disabled}
              className={cn(
                "p-4 rounded-full shadow-lg transition-all",
                disabled 
                  ? "bg-gray-300 cursor-not-allowed" 
                  : "bg-[#9C1E1E] hover:bg-[#7D1818]"
              )}
            >
              <Mic className="h-6 w-6 text-white" />
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Inline variant - compact button for forms
  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2 flex-shrink-0", className)}>
        {isRecording ? (
          <div className="flex items-center gap-2 bg-red-50 rounded-xl px-3 py-1.5 border border-red-200">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={cancelRecording}
              className="h-8 w-8 text-gray-500 hover:text-red-600"
            >
              <MicOff className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1.5 text-red-600 text-xs">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-mono font-medium">{formattedDuration}</span>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={stopRecording}
              className="h-8 w-8"
            >
              <Square className="h-3 w-3 fill-current" />
            </Button>
          </div>
        ) : isTranscribing ? (
          <div className="flex items-center gap-2 bg-[#9C1E1E]/10 text-[#9C1E1E] rounded-xl px-3 py-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Transcrevendo...</span>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={startRecording}
            disabled={disabled}
            className="h-10 w-10 rounded-xl border-[#9C1E1E]/30 text-[#9C1E1E] hover:bg-[#9C1E1E]/10 hover:border-[#9C1E1E]/50 flex-shrink-0"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    );
  }

  // Default variant - standard button
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {isRecording ? (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={cancelRecording}
          >
            <MicOff className="h-5 w-5 mr-2" />
            Cancelar
          </Button>

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full"
          >
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="text-lg font-mono">{formattedDuration}</span>
          </motion.div>

          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={stopRecording}
          >
            <Square className="h-5 w-5 mr-2 fill-current" />
            Parar
          </Button>
        </div>
      ) : isTranscribing ? (
        <Button type="button" size="lg" disabled className="min-w-[200px]">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Transcrevendo...
        </Button>
      ) : (
        <Button
          type="button"
          size="lg"
          onClick={startRecording}
          disabled={disabled}
          className="min-w-[200px] bg-[#9C1E1E] hover:bg-[#7D1818]"
        >
          <Mic className="h-5 w-5 mr-2" />
          Gravar Áudio
        </Button>
      )}

      {transcription && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
        >
          <p className="text-sm text-emerald-800">
            <strong>Transcrição:</strong> {transcription}
          </p>
        </motion.div>
      )}
    </div>
  );
}
