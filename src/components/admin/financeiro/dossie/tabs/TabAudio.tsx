/**
 * TabAudio - Gravação de áudio e transcrição
 * Permite gravar observações por voz
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mic, 
  Square, 
  Play, 
  Pause,
  Trash2,
  Loader2,
  Clock,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AudioRecord } from '../types';
import { toast } from 'sonner';

interface TabAudioProps {
  audios: AudioRecord[];
  onUpload: (audioBlob: Blob, duracao: number) => Promise<boolean>;
  onDelete: (audio: AudioRecord) => Promise<boolean>;
}

const TabAudio: React.FC<TabAudioProps> = ({
  audios,
  onUpload,
  onDelete
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Não foi possível acessar o microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const discardRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const handleUpload = async () => {
    if (!audioBlob) return;
    
    setUploading(true);
    const success = await onUpload(audioBlob, recordingTime);
    if (success) {
      discardRecording();
    }
    setUploading(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = (audio: AudioRecord) => {
    if (playingId === audio.id) {
      audioPlayerRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = audio.audio_url;
        audioPlayerRef.current.play();
        setPlayingId(audio.id);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <audio 
        ref={audioPlayerRef}
        onEnded={() => setPlayingId(null)}
        className="hidden"
      />

      {/* Recording UI */}
      <div className="space-y-4">
        {!audioBlob ? (
          <div className="flex flex-col items-center gap-4 py-8">
            {!isRecording ? (
              <>
                <button
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  <Mic className="h-8 w-8 text-white" />
                </button>
                <p className="text-sm text-gray-500">
                  Clique para gravar uma observação
                </p>
              </>
            ) : (
              <>
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-red-100 animate-pulse" />
                  <button
                    onClick={stopRecording}
                    className="absolute inset-0 w-20 h-20 rounded-full bg-red-500 flex items-center justify-center"
                  >
                    <Square className="h-6 w-6 text-white" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-lg font-mono font-medium">
                    {formatTime(recordingTime)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Gravando... Clique para parar
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-xl border space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const audio = new Audio(audioUrl!);
                  audio.play();
                }}
                className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-800"
              >
                <Play className="h-5 w-5 text-white ml-0.5" />
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Gravação ({formatTime(recordingTime)})
                </p>
                <p className="text-xs text-gray-500">
                  Pronto para enviar
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={discardRecording}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Button 
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Salvar Gravação'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Audio list */}
      {audios.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Gravações ({audios.length})
          </h3>
          
          <div className="space-y-2">
            {audios.map((audio) => (
              <div
                key={audio.id}
                className="p-4 bg-white rounded-lg border"
              >
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => togglePlay(audio)}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                  >
                    {playingId === audio.id ? (
                      <Pause className="h-4 w-4 text-gray-700" />
                    ) : (
                      <Play className="h-4 w-4 text-gray-700 ml-0.5" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-medium text-gray-700">
                        {audio.gravado_por_nome || 'Usuário'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {audio.duracao_segundos ? formatTime(audio.duracao_segundos) : '--:--'}
                      </span>
                      <span>•</span>
                      <span>
                        {format(new Date(audio.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                    onClick={() => onDelete(audio)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Transcription */}
                {(audio.transcricao || audio.transcricao_editada) && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-medium text-gray-500 mb-1">Transcrição</p>
                    <p className="text-sm text-gray-700">
                      {audio.transcricao_editada || audio.transcricao}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : !audioBlob && (
        <div className="text-center py-8">
          <Mic className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nenhuma gravação</p>
          <p className="text-xs text-gray-400 mt-1">
            Grave observações rápidas por voz
          </p>
        </div>
      )}
    </div>
  );
};

export default TabAudio;
