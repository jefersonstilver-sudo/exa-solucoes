import React from 'react';
import { Check, CheckCheck, FileText, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface MobileMessageBubbleProps {
  message: any;
  index: number;
}

export const MobileMessageBubble: React.FC<MobileMessageBubbleProps> = ({ message, index }) => {
  const isOutbound = message.direction === 'outbound';
  const mediaUrl = message.raw_payload?.mediaUrl || message.media_url;
  const mediaType = message.raw_payload?.mediaType || message.metadata?.media_type;
  const hasMedia = !!mediaUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.02, duration: 0.15 }}
      className={cn(
        'flex mb-2 px-4',
        isOutbound ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'relative max-w-[85%] rounded-lg',
          isOutbound
            ? 'bg-[#dcf8c6] dark:bg-[#005c4b] text-[#000000] dark:text-white rounded-br-none'
            : 'bg-white dark:bg-[#1f2c33] text-[#000000] dark:text-white shadow-sm rounded-bl-none'
        )}
      >
        {/* Cauda da bolha (estilo WhatsApp) */}
        <div
          className={cn(
            'absolute bottom-0 w-0 h-0',
            isOutbound
              ? 'right-0 -mr-2 border-l-8 border-l-[#dcf8c6] dark:border-l-[#005c4b] border-b-8 border-b-transparent'
              : 'left-0 -ml-2 border-r-8 border-r-white dark:border-r-[#1f2c33] border-b-8 border-b-transparent'
          )}
        />

        <div className="p-2">
          {/* Imagem */}
          {mediaType === 'image' && hasMedia && (
            <div className="mb-1 -m-2 mb-2">
              <img
                src={mediaUrl}
                alt="Imagem"
                className="rounded-t-lg max-w-full h-auto cursor-pointer hover:opacity-90 max-h-72 object-cover w-full"
                onClick={() => window.open(mediaUrl, '_blank')}
                loading="lazy"
              />
            </div>
          )}

          {/* Áudio */}
          {mediaType === 'audio' && hasMedia && (
            <div className="mb-2 flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-lg p-2">
              <Volume2 className="w-4 h-4 shrink-0 opacity-60" />
              <audio controls className="w-full" style={{ height: '32px' }}>
                <source src={mediaUrl} />
              </audio>
            </div>
          )}

          {/* Vídeo */}
          {mediaType === 'video' && hasMedia && (
            <div className="mb-1 -m-2 mb-2">
              <video controls className="rounded-t-lg max-w-full h-auto max-h-72 w-full">
                <source src={mediaUrl} />
              </video>
            </div>
          )}

          {/* Documento */}
          {mediaType === 'document' && hasMedia && (
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 mb-2 p-2 bg-black/5 dark:bg-white/5 rounded-lg"
            >
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-sm text-blue-600 hover:underline truncate">
                Abrir documento
              </span>
            </a>
          )}

          {/* Texto da mensagem */}
          {message.body && (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.body}
            </p>
          )}

          {/* Badges de análise (apenas inbound) */}
          {!isOutbound && message.sentiment && (
            <div className="mt-2 flex gap-1 flex-wrap">
              <Badge variant="outline" className="text-[10px] h-4 px-1">
                {message.sentiment}
              </Badge>
              {message.detected_mood > 0 && (
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  Humor: {message.detected_mood}
                </Badge>
              )}
            </div>
          )}

          {/* Footer: Hora + Status */}
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[11px] opacity-60">
              {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
            </span>
            {isOutbound && (
              <span className="opacity-60">
                {message.status === 'sent' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
