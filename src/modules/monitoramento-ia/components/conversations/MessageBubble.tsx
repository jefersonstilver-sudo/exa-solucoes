import { AlertCircle, Download, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useRef, useEffect } from 'react';

interface MessageBubbleProps {
  direction: 'inbound' | 'outbound';
  messageText: string;
  mediaUrl?: string | null;
  mediaType?: string;
  status?: string;
  errorMessage?: string | null;
  createdAt: string;
}

export const MessageBubble = ({
  direction,
  messageText,
  mediaUrl,
  mediaType,
  status,
  errorMessage,
  createdAt
}: MessageBubbleProps) => {
  const isOutbound = direction === 'outbound';
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleAudioPlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  const renderMedia = () => {
    if (!mediaUrl) return null;

    switch (mediaType) {
      case 'image':
        return (
          <div className="mb-2">
            <img 
              src={mediaUrl} 
              alt="Imagem enviada"
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(mediaUrl, '_blank')}
            />
          </div>
        );
      
      case 'sticker':
        return (
          <div className="mb-2 flex justify-center">
            <img 
              src={mediaUrl} 
              alt="Figurinha"
              className="w-32 h-32 object-contain"
            />
          </div>
        );
      
      case 'audio':
        return (
          <div className="mb-2 flex items-center gap-2 bg-black/10 dark:bg-white/10 rounded-full px-4 py-2">
            <button
              onClick={handleAudioPlayPause}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <audio ref={audioRef} src={mediaUrl} />
            <span className="text-xs opacity-70">Áudio</span>
          </div>
        );
      
      case 'video':
        return (
          <div className="mb-2">
            <video 
              src={mediaUrl} 
              controls
              className="max-w-full rounded-lg"
            />
          </div>
        );
      
      case 'document':
        return (
          <div className="mb-2">
            <a 
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-black/10 dark:bg-white/10 rounded-lg px-3 py-2 hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Baixar documento</span>
            </a>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
          isOutbound
            ? 'bg-[#25D366] text-white rounded-br-sm'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
        }`}
        style={{
          boxShadow: isOutbound 
            ? '0 1px 2px rgba(0,0,0,0.1)' 
            : '0 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        {/* Badge indicador de origem */}
        {isOutbound && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              🤖 <span className="font-medium">Agente</span>
            </span>
          </div>
        )}
        {!isOutbound && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              📱 <span className="font-medium">WhatsApp</span>
            </span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 mb-2 text-red-300">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Erro ao enviar</span>
          </div>
        )}
        
        {renderMedia()}
        
        {messageText && messageText !== '[Imagem]' && messageText !== '[Áudio]' && messageText !== '[Figurinha]' && messageText !== '[Vídeo]' && (
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {messageText}
          </p>
        )}
        
        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
          isOutbound 
            ? 'text-white/70' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {format(new Date(createdAt), "HH:mm", { locale: ptBR })}
          {isOutbound && status === 'sent' && <span>✓</span>}
          {isOutbound && status === 'delivered' && <span>✓✓</span>}
        </div>

        {errorMessage && (
          <p className="text-xs mt-2 text-red-300">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};
