import React, { useState, useRef, useEffect } from 'react';
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

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
    <div className="flex gap-1 md:gap-2 p-1.5 md:p-4 bg-card items-end">
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
        className="shrink-0 h-8 w-8 md:h-10 md:w-10 touch-manipulation"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
        ) : (
          <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
        )}
      </Button>

      {/* Botão Emoji */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            disabled={uploading || sending || recording}
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 md:h-10 md:w-10 touch-manipulation"
          >
            <Smile className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 border-0" 
          align="start"
          side="top"
        >
          <Picker 
            data={data} 
            onEmojiSelect={handleEmojiSelect}
            theme="auto"
            locale="pt"
            perLine={8}
            previewPosition="none"
          />
        </PopoverContent>
      </Popover>

      {/* Campo de texto */}
      {!recording && (
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder="Mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="resize-none rounded-3xl pr-10 bg-background text-base min-h-[40px] max-h-[120px] overflow-y-auto placeholder:text-muted-foreground touch-manipulation"
            disabled={sending || uploading}
            style={{ height: 'auto' }}
          />
        </div>
      )}

      {/* Indicador de gravação */}
      {recording && (
        <div className="flex-1 flex items-center gap-2 md:gap-3 bg-red-50 dark:bg-red-900/20 rounded-3xl px-3 md:px-4 py-2">
          <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs md:text-sm font-medium text-red-600 dark:text-red-400 flex-1">
            {formatRecordingTime(recordingTime)}
          </span>
          <Button
            onClick={stopRecording}
            size="sm"
            variant="ghost"
            className="h-7 w-7 md:h-8 md:w-8 p-0"
          >
            <X className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        </div>
      )}

      {/* Botão Gravar/Parar áudio */}
      {!message.trim() ? (
        <Button
          onClick={recording ? stopRecording : startRecording}
          disabled={uploading || sending}
          variant="ghost"
          size="icon"
          className={`shrink-0 h-8 w-8 md:h-10 md:w-10 touch-manipulation ${recording ? 'text-red-500 animate-pulse' : ''}`}
        >
          <Mic className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
      ) : (
        <Button
          onClick={handleSend}
          disabled={sending}
          size="icon"
          className="shrink-0 rounded-full bg-[#25D366] hover:bg-[#20bd5a] h-8 w-8 md:h-10 md:w-10 touch-manipulation"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
          )}
        </Button>
      )}
    </div>
  );
};