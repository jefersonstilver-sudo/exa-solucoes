import React from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatContactName } from '@/modules/monitoramento-ia/utils/contactFormatters';

interface MobileChatHeaderProps {
  conversation: any;
  onBack: () => void;
  onDetailsClick: () => void;
}

export const MobileChatHeader: React.FC<MobileChatHeaderProps> = ({
  conversation,
  onBack,
  onDetailsClick
}) => {
  return (
    <header className="whatsapp-header pt-safe sticky top-0 z-50 shadow-lg">
      <div className="flex items-center justify-between px-2 py-2">
        {/* Botão Voltar + Info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/10 touch-manipulation h-10 w-10 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <button
            onClick={onDetailsClick}
            className="flex items-center gap-3 flex-1 min-w-0 touch-manipulation"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              {conversation.awaiting_response && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full border-2 border-[#25D366]" />
              )}
            </div>

            {/* Nome e Status */}
            <div className="text-left flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-white font-medium text-sm truncate">
                  {formatContactName(conversation.contact_name, conversation.contact_phone)}
                </h2>
                {conversation.is_sindico && (
                  <Badge className="text-[9px] px-1 py-0 h-3.5 bg-white/20 text-white border-0">
                    Síndico
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-white/80 text-xs">
                {conversation.awaiting_response ? (
                  <span>Aguardando resposta</span>
                ) : (
                  <span>Online</span>
                )}
                {conversation.is_hot_lead && (
                  <>
                    <span>•</span>
                    <span className="text-orange-300">🔥 Hot Lead</span>
                  </>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const whatsappUrl = `https://wa.me/${conversation.contact_phone.replace(/\D/g, '')}`;
              window.open(whatsappUrl, '_blank');
            }}
            className="text-white hover:bg-white/10 touch-manipulation h-9 w-9"
          >
            <Phone className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onDetailsClick}
            className="text-white hover:bg-white/10 touch-manipulation h-9 w-9"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
