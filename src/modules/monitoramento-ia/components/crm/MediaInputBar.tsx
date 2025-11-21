import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Loader2, 
  X,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface MediaInputBarProps {
  phoneNumber: string;
  agentKey: string;
  conversationId?: string;
  onMessageSent?: () => void;
}

export const MediaInputBar: React.FC<MediaInputBarProps> = ({
  phoneNumber,
  agentKey,
  conversationId,
  onMessageSent
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Enviar mensagem de texto
  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('zapi-send-message', {
        body: {
          agentKey,
          phone: phoneNumber,
          message: message.trim()
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Mensagem enviada');
        setMessage('');
        if (onMessageSent) onMessageSent();
      } else {
        throw new Error(data?.error || 'Erro ao enviar');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  // Upload de arquivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 50MB');
      return;
    }

    setUploading(true);
    try {
      // 1. Fazer upload para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${agentKey}/${fileName}`;

      console.log('Uploading file:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      console.log('File uploaded:', publicUrl);

      // 3. Determinar tipo de mídia
      let mediaType = 'document';
      if (file.type.startsWith('image/')) mediaType = 'image';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';
      else if (file.type.startsWith('video/')) mediaType = 'video';

      // 4. Enviar via Z-API
      const { data, error } = await supabase.functions.invoke('zapi-send-media', {
        body: {
          agentKey,
          phone: phoneNumber,
          mediaUrl: publicUrl,
          mediaType,
          caption: file.name
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${mediaType === 'image' ? 'Imagem' : 'Arquivo'} enviado com sucesso`);
        if (onMessageSent) onMessageSent();
      } else {
        throw new Error(data?.error || 'Erro ao enviar arquivo');
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Erro ao enviar arquivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Inserir emoji
  const handleEmojiSelect = (emoji: any) => {
    const cursorPosition = textareaRef.current?.selectionStart || message.length;
    const newMessage = 
      message.substring(0, cursorPosition) + 
      emoji.native + 
      message.substring(cursorPosition);
    setMessage(newMessage);
    
    // Focar no textarea após inserir emoji
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        cursorPosition + emoji.native.length,
        cursorPosition + emoji.native.length
      );
    }, 0);
  };

  // Gravar áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
        
        // Parar stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);

      // Contador de tempo
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Gravando áudio...');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Erro ao acessar microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const uploadAudio = async (audioBlob: Blob) => {
    setUploading(true);
    try {
      const fileName = `audio_${Date.now()}.webm`;
      const filePath = `${agentKey}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      const { data, error } = await supabase.functions.invoke('zapi-send-media', {
        body: {
          agentKey,
          phone: phoneNumber,
          mediaUrl: publicUrl,
          mediaType: 'audio'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Áudio enviado com sucesso');
        if (onMessageSent) onMessageSent();
      } else {
        throw new Error(data?.error || 'Erro ao enviar áudio');
      }
    } catch (error: any) {
      console.error('Error uploading audio:', error);
      toast.error(error.message || 'Erro ao enviar áudio');
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex gap-2 p-4 border-t border-border bg-card">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        onChange={handleFileSelect}
      />

      {/* Botão Anexar */}
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || sending || recording}
        variant="ghost"
        size="icon"
        className="shrink-0"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
      </Button>

      {/* Botão Emoji */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            disabled={uploading || sending || recording}
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            <Smile className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-0" align="start">
          <Picker 
            data={data} 
            onEmojiSelect={handleEmojiSelect}
            theme="auto"
            locale="pt"
          />
        </PopoverContent>
      </Popover>

      {/* Campo de texto */}
      {!recording && (
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder="Digite uma mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="resize-none rounded-3xl pr-12 bg-background"
            disabled={sending || uploading}
          />
          {message.length > 0 && (
            <span className="absolute right-3 bottom-3 text-xs text-muted-foreground">
              {message.length}
            </span>
          )}
        </div>
      )}

      {/* Indicador de gravação */}
      {recording && (
        <div className="flex-1 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-3xl px-4 py-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-red-600 dark:text-red-400">
            Gravando: {formatRecordingTime(recordingTime)}
          </span>
          <Button
            onClick={stopRecording}
            size="sm"
            variant="ghost"
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Botão Gravar/Parar áudio */}
      <Button
        onClick={recording ? stopRecording : startRecording}
        disabled={uploading || sending}
        variant="ghost"
        size="icon"
        className={`shrink-0 ${recording ? 'text-red-500' : ''}`}
      >
        <Mic className="w-5 h-5" />
      </Button>

      {/* Botão Enviar */}
      <Button
        onClick={handleSend}
        disabled={!message.trim() || sending || uploading || recording}
        size="icon"
        className="shrink-0 rounded-full bg-[#25D366] hover:bg-[#20bd5a]"
      >
        {sending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};