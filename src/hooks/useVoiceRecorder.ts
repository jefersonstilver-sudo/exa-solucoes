import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseVoiceRecorderOptions {
  onTranscriptionComplete?: (text: string) => void;
  onAudioUrlReady?: (url: string) => void;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscription(null);
      setAudioUrl(null);
      chunksRef.current = [];

      // Solicitar permissão do microfone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      streamRef.current = stream;

      // Criar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;

      // Coletar chunks de áudio
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Quando parar, processar o áudio
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Upload para Supabase Storage
        try {
          setIsTranscribing(true);
          
          const fileName = `voice-${Date.now()}.webm`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('voice-recordings')
            .upload(`legal-flow/${fileName}`, audioBlob, {
              contentType: 'audio/webm',
              upsert: true,
            });

          if (uploadError) {
            // Se o bucket não existir, tentar criar
            if (uploadError.message.includes('Bucket not found')) {
              toast.error('Bucket de áudio não configurado. Por favor, crie o bucket "voice-recordings" no Supabase.');
              setError('Bucket de áudio não configurado');
              setIsTranscribing(false);
              return;
            }
            throw uploadError;
          }

          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from('voice-recordings')
            .getPublicUrl(`legal-flow/${fileName}`);

          const publicUrl = urlData.publicUrl;
          setAudioUrl(publicUrl);
          options.onAudioUrlReady?.(publicUrl);

          // Transcrever usando a Edge Function
          const { data: transcribeResult, error: transcribeError } = await supabase.functions.invoke('transcribe-audio', {
            body: {
              audioUrl: publicUrl,
              language: 'pt',
              prompt: 'Contexto jurídico e comercial sobre contratos, parcerias, síndicos, prédios, mídia em elevadores, comodato, permuta.'
            }
          });

          if (transcribeError) throw transcribeError;

          if (transcribeResult?.text) {
            setTranscription(transcribeResult.text);
            options.onTranscriptionComplete?.(transcribeResult.text);
            toast.success('Áudio transcrito com sucesso!');
          } else {
            throw new Error('Falha na transcrição');
          }

        } catch (err: any) {
          console.error('[useVoiceRecorder] Error:', err);
          setError(err.message);
          toast.error('Erro ao processar áudio: ' + err.message);
        } finally {
          setIsTranscribing(false);
        }
      };

      // Iniciar gravação
      mediaRecorder.start(1000); // Chunk a cada 1 segundo
      setIsRecording(true);
      setRecordingDuration(0);

      // Timer para mostrar duração
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      toast.info('Gravação iniciada. Fale agora...');

    } catch (err: any) {
      console.error('[useVoiceRecorder] Start error:', err);
      setError(err.message);
      
      if (err.name === 'NotAllowedError') {
        toast.error('Permissão de microfone negada. Por favor, permita o acesso ao microfone.');
      } else {
        toast.error('Erro ao iniciar gravação: ' + err.message);
      }
    }
  }, [options]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Parar timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Parar stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      toast.info('Processando áudio...');
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      chunksRef.current = [];

      // Parar timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Parar stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      setRecordingDuration(0);
      toast.info('Gravação cancelada');
    }
  }, [isRecording]);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const reset = useCallback(() => {
    setTranscription(null);
    setAudioUrl(null);
    setError(null);
    setRecordingDuration(0);
  }, []);

  return {
    isRecording,
    isTranscribing,
    recordingDuration,
    formattedDuration: formatDuration(recordingDuration),
    audioUrl,
    transcription,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  };
}
