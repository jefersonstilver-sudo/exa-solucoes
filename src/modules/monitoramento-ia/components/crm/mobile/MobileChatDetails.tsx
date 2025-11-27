import React, { useState } from 'react';
import { 
  X, Bell, BellOff, User, Tag, Clock, TrendingUp, 
  FileText, Sparkles, Plus, StickyNote, Tags as TagsIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { formatContactName, formatPhoneSecondary } from '@/modules/monitoramento-ia/utils/contactFormatters';
import { formatResponseTime } from '@/modules/monitoramento-ia/utils/formatters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useLeadDetails } from '../../../hooks/useLeadDetails';
import { ConversationTags } from '../ConversationTags';
import { ConversationNotes } from '../ConversationNotes';
import { LeadAnalysisSection } from '../LeadAnalysisSection';
import { ConversationReports } from '../ConversationReports';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContactTypes } from '../../../hooks/useContactTypes';
import { useLeadProfile } from '../../../hooks/useLeadProfile';
import { IconMapper } from './IconMapper';

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
  const [isMuted, setIsMuted] = useState(conversation.is_muted || false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  
  const { lead, metrics, loading: leadLoading, updateLeadType, toggleHotLead, generateReport } = useLeadDetails(conversation.id);
  const { contactTypes } = useContactTypes();
  const { profile } = useLeadProfile(conversation.id);

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

  const handleUpdateContactType = async (typeName: string) => {
    await updateLeadType(typeName);
    onUpdate();
  };

  const handleToggleHotLead = async () => {
    await toggleHotLead();
    onUpdate();
  };

  const handleGenerateReport = async () => {
    setIsUpdating(true);
    try {
      await generateReport();
      toast({
        title: 'Relatório gerado',
        description: 'O relatório de análise foi gerado com sucesso'
      });
      onUpdate();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o relatório',
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
            className="fixed right-0 top-0 bottom-0 w-full bg-background z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#9C1E1E] to-[#D72638] text-white p-4 flex items-center justify-between z-10">
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

            {/* Tabs de Navegação */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 rounded-none bg-muted/50">
                <TabsTrigger value="info" className="text-xs">
                  <User className="w-4 h-4 mr-1" />
                  Info
                </TabsTrigger>
                <TabsTrigger value="tags" className="text-xs">
                  <TagsIcon className="w-4 h-4 mr-1" />
                  Tags
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs">
                  <StickyNote className="w-4 h-4 mr-1" />
                  Notas
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-xs">
                  <Sparkles className="w-4 h-4 mr-1" />
                  IA
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
                {/* Tab: Informações */}
                <TabsContent value="info" className="p-4 space-y-6 m-0">
                  {/* Avatar e Nome */}
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#9C1E1E] to-[#D72638] flex items-center justify-center border-4 border-primary/30">
                      <User className="w-12 h-12 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {formatContactName(conversation.contact_name, conversation.contact_phone)}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatPhoneSecondary(conversation.contact_phone)}
                      </p>
                    </div>
                  </div>

                  {/* Tipo de Contato */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Tipo de Contato</label>
                    <Select 
                      value={conversation.contact_type || ''} 
                      onValueChange={handleUpdateContactType}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {contactTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            <div className="flex items-center gap-2">
                              <IconMapper iconName={type.icon} className="w-4 h-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Opção de Silenciar */}
                  <div className="bg-card rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isMuted ? (
                          <BellOff className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Bell className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium text-foreground">
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

                  {/* Ações Rápidas */}
                  <div className="space-y-2">
                    <Button
                      variant={conversation.is_hot_lead ? 'default' : 'outline'}
                      className={cn(
                        'w-full',
                        conversation.is_hot_lead && 'bg-orange-500 hover:bg-orange-600'
                      )}
                      onClick={handleToggleHotLead}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {conversation.is_hot_lead ? 'Hot Lead Ativo' : 'Marcar como Hot Lead'}
                    </Button>
                  </div>

                  {/* Informações do Agente */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                      Informações
                    </h4>
                    
                    {/* Agente */}
                    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
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
                  </div>

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
                    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
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
                        <div className="p-3 bg-card rounded-lg border text-center">
                          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Lead Score</p>
                          <p className="text-lg font-bold text-foreground">{conversation.lead_score}</p>
                        </div>
                      )}
                      {conversation.mood_score > 0 && (
                        <div className="p-3 bg-card rounded-lg border text-center">
                          <span className="text-2xl">😊</span>
                          <p className="text-xs text-muted-foreground">Humor</p>
                          <p className="text-lg font-bold text-foreground">{conversation.mood_score}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Métricas do Lead */}
                  {metrics && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-card rounded-lg border text-center">
                        <p className="text-xs text-muted-foreground mb-1">Mensagens</p>
                        <p className="text-2xl font-bold text-foreground">{metrics.totalMessages}</p>
                      </div>
                      <div className="p-3 bg-card rounded-lg border text-center">
                        <p className="text-xs text-muted-foreground mb-1">Tempo Resp.</p>
                        <p className="text-xl font-bold text-foreground">
                          {formatResponseTime(conversation.avg_response_time)}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Tags */}
                <TabsContent value="tags" className="p-4 m-0">
                  <ConversationTags
                    phoneNumber={conversation.contact_phone}
                    agentKey={conversation.agent_key}
                  />
                </TabsContent>

                {/* Tab: Notas */}
                <TabsContent value="notes" className="p-4 m-0">
                  <ConversationNotes
                    phoneNumber={conversation.contact_phone}
                    agentKey={conversation.agent_key}
                  />
                </TabsContent>

                {/* Tab: Análise de IA */}
                <TabsContent value="ai" className="p-4 space-y-4 m-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Análise de IA
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateReport}
                        disabled={isUpdating}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Gerar
                      </Button>
                    </div>
                    
                    {leadLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Carregando análise...</p>
                      </div>
                    ) : (
                      <>
                        <LeadAnalysisSection 
                          profile={profile} 
                          detectedType={lead?.contact_type || null}
                          loading={leadLoading}
                        />
                        
                        {/* Relatórios Gerados */}
                        <div className="pt-4 border-t">
                          <ConversationReports conversationId={conversation.id} />
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
