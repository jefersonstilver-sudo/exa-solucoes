import React from 'react';
import { MessagePreview as MessagePreviewType } from '../../../hooks/useConversationContextDetailed';
import { Image, Mic, Video, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessagePreviewProps {
  message: MessagePreviewType;
}

export const MessagePreview: React.FC<MessagePreviewProps> = ({ message }) => {
  const getMediaIcon = () => {
    switch (message.mediaType) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'audio':
        return <Mic className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getMediaLabel = () => {
    switch (message.mediaType) {
      case 'image':
        return '[Imagem]';
      case 'audio':
        return '[Áudio]';
      case 'video':
        return '[Vídeo]';
      case 'document':
        return '[Documento]';
      default:
        return '';
    }
  };

  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/5 transition-colors">
      <div className="flex-shrink-0 text-xs text-muted-foreground min-w-[60px]">
        {message.timestamp}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span 
            className={cn(
              "text-xs font-medium",
              message.senderType === 'contact' 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-green-600 dark:text-green-400"
            )}
          >
            {message.sender}
          </span>
          {message.hasMedia && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {getMediaIcon()}
            </span>
          )}
        </div>
        
        <p className="text-sm text-foreground/90 line-clamp-2">
          {message.hasMedia && message.text === '[Mensagem vazia]' 
            ? getMediaLabel() 
            : message.text}
        </p>
      </div>
    </div>
  );
};
