import React from 'react';
import { X, Bell, BellOff, User, Tag, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { formatContactName, formatPhoneSecondary } from '@/modules/monitoramento-ia/utils/contactFormatters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MobileChatDetailsProps {
  conversation: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const MobileChatDetails: React.FC<MobileChatDetailsProps> = ({
  conversation,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { toast } = useToast();
  const [isMuted, setIsMuted] = React.useState(conversation.is_muted || false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleToggleMute = async () => {
    setIsUpdating(true);
    try {
      const newMutedState = !isMuted;
      
      const { error } = await supabase
        .from('conversations')
        .update({ is_muted: newMutedState })
        .eq('id', conversation.id);

      if (error) throw error;

      setIsMuted(newMutedState);
      toast({
        title: newMutedState ? 'Conversa silenciada' : 'Conversa reativada',
        description: newMutedState 
          ? 'Você não receberá notificações desta conversa' 
          : 'Notificações reativadas para esta conversa'
      });
      
      onUpdate();
    } catch (error: any) {
      console.error('Erro ao silenciar conversa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as notificações',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60]"
          />

          {/* Painel Lateral */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-[70] shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#25D366] text-white p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Detalhes do Contato</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Conteúdo */}
            <div className="p-4 space-y-6">
              {/* Avatar e Nome */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-24 h-24 rounded-full bg-[#25D366]/20 flex items-center justify-center border-4 border-[#25D366]/30">
                  <User className="w-12 h-12 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-module-primary">
                    {formatContactName(conversation.contact_name, conversation.contact_phone)}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatPhoneSecondary(conversation.contact_phone)}
                  </p>
                </div>
              </div>

              {/* Opção de Silenciar */}
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isMuted ? (
                      <BellOff className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Bell className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-module-primary">
                        {isMuted ? 'Conversa silenciada' : 'Notificações ativas'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isMuted 
                          ? 'Não aparecerá como nova na lista' 
                          : 'Você receberá notificações'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isMuted}
                    onCheckedChange={handleToggleMute}
                    disabled={isUpdating}
                  />
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                  Informações
                </h4>
                
                {/* Agente */}
                <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Agente</p>
                    <p className="font-medium text-sm capitalize">
                      {conversation.agent_key === 'sofia' && '🤖 Sofia'}
                      {conversation.agent_key === 'eduardo' && '🤖 Eduardo'}
                      {conversation.agent_key === 'exa_alert' && '🤖 Exa Alert'}
                    </p>
                  </div>
                </div>

                {/* Tipo de Contato */}
                {conversation.contact_type && (
                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {conversation.contact_type_source === 'manual' ? '👤' : '🤖'} {conversation.contact_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="space-y-2">
                  {conversation.is_critical && (
                    <Badge variant="destructive" className="w-full justify-center py-2">
                      🚨 Conversa Crítica
                    </Badge>
                  )}
                  {conversation.is_hot_lead && (
                    <Badge className="w-full justify-center py-2 bg-orange-500 hover:bg-orange-600">
                      🔥 Hot Lead
                    </Badge>
                  )}
                  {conversation.is_sindico && (
                    <Badge variant="outline" className="w-full justify-center py-2">
                      👔 Síndico
                    </Badge>
                  )}
                  {conversation.awaiting_response && (
                    <Badge variant="secondary" className="w-full justify-center py-2">
                      <Clock className="w-3 h-3 mr-1" />
                      Aguardando Resposta
                    </Badge>
                  )}
                </div>

                {/* Sentimento */}
                {conversation.sentiment && (
                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-lg',
                      conversation.sentiment === 'positive' && 'bg-green-500/20',
                      conversation.sentiment === 'neutral' && 'bg-gray-500/20',
                      conversation.sentiment === 'negative' && 'bg-orange-500/20',
                      conversation.sentiment === 'angry' && 'bg-red-500/20'
                    )}>
                      {conversation.sentiment === 'positive' && '😊'}
                      {conversation.sentiment === 'neutral' && '😐'}
                      {conversation.sentiment === 'negative' && '😟'}
                      {conversation.sentiment === 'angry' && '😡'}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Sentimento</p>
                      <p className="font-medium text-sm capitalize">
                        {conversation.sentiment === 'positive' && 'Positivo'}
                        {conversation.sentiment === 'neutral' && 'Neutro'}
                        {conversation.sentiment === 'negative' && 'Negativo'}
                        {conversation.sentiment === 'angry' && 'Irritado'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Scores */}
                {(conversation.lead_score > 0 || conversation.mood_score > 0) && (
                  <div className="grid grid-cols-2 gap-3">
                    {conversation.lead_score > 0 && (
                      <div className="p-3 bg-card rounded-lg border border-border text-center">
                        <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Lead Score</p>
                        <p className="text-lg font-bold text-module-primary">{conversation.lead_score}</p>
                      </div>
                    )}
                    {conversation.mood_score > 0 && (
                      <div className="p-3 bg-card rounded-lg border border-border text-center">
                        <span className="text-2xl">😊</span>
                        <p className="text-xs text-muted-foreground">Humor</p>
                        <p className="text-lg font-bold text-module-primary">{conversation.mood_score}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
