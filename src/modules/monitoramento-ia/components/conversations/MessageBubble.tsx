import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Download, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MessageBubbleProps {
  direction: 'inbound' | 'outbound';
  messageText: string;
  mediaUrl?: string | null;
  mediaType?: string;
  status?: string;
  errorMessage?: string | null;
  createdAt: string;
}

const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({
  direction,
  messageText,
  mediaUrl,
  mediaType,
  status,
  errorMessage,
  createdAt
}) => {
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
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}>
      <div
        className={`
          relative max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2
          ${isOutbound 
            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef]' 
            : 'bg-white dark:bg-[#1f2c33] text-[#111b21] dark:text-[#e9edef]'
          }
          shadow-sm
        `}
      >
        {status === 'error' && (
          <div className="flex items-center gap-2 mb-2 text-red-300">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Erro ao enviar</span>
          </div>
        )}
        
        {renderMedia()}
        
        {messageText && messageText !== '[Imagem]' && messageText !== '[Áudio]' && messageText !== '[Figurinha]' && messageText !== '[Vídeo]' && (
          <p className="text-xs md:text-sm whitespace-pre-wrap break-words">
            {messageText}
          </p>
        )}
        
        <div className="flex items-center gap-1 mt-1 justify-end">
          <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">
            {format(new Date(createdAt), 'HH:mm')}
          </span>
          
          {isOutbound && status && (
            <div className="flex items-center">
              {status === 'sent' && <span className="text-xs text-[#667781]">✓</span>}
              {status === 'delivered' && <span className="text-xs text-[#667781]">✓✓</span>}
              {status === 'read' && <span className="text-xs text-[#53bdeb]">✓✓</span>}
            </div>
          )}
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

// Memoize to prevent unnecessary re-renders
export const MessageBubble = React.memo(MessageBubbleComponent, (prev, next) => {
  return (
    prev.direction === next.direction &&
    prev.messageText === next.messageText &&
    prev.status === next.status &&
    prev.createdAt === next.createdAt &&
    prev.mediaType === next.mediaType &&
    prev.mediaUrl === next.mediaUrl
  );
});
