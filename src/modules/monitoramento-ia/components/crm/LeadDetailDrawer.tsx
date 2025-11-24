import React, { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, User, Phone, Bot, Flame, AlertTriangle, Plus } from 'lucide-react';
import { useLeadDetails } from '../../hooks/useLeadDetails';
import { useContactTypes } from '../../hooks/useContactTypes';
import { ConversationNotes } from './ConversationNotes';
import { ConversationTags } from './ConversationTags';
import { ContactTypeManager } from './ContactTypeManager';

interface LeadDetailDrawerProps {
  conversationId: string | null;
  open: boolean;
  onClose: () => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  conversationId,
  open,
  onClose
}) => {
  const { lead, metrics, loading, updateLeadType, updateLeadScore, toggleSindico, toggleHotLead } = useLeadDetails(conversationId);
  const { contactTypes } = useContactTypes();
  const [showTypeManager, setShowTypeManager] = useState(false);

  if (!conversationId || !lead) {
    return null;
  }

  return (
    <>
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DrawerContent>
          <DrawerHeader className="border-b border-module-border">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DrawerTitle className="text-xl">Detalhes do Lead</DrawerTitle>
                <DrawerDescription>
                  Informações completas e métricas da conversa
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="w-4 h-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto max-h-[80vh] p-6 space-y-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando detalhes...
              </div>
            ) : (
              <>
                {/* Header com Info Básica */}
                <div className="glass-card p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {lead.contact_name || 'Sem nome'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {lead.contact_phone}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bot className="w-4 h-4" />
                    Agente: <span className="font-medium">{lead.agent_key}</span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {lead.is_hot_lead && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        Hot Lead
                      </Badge>
                    )}
                    {lead.is_critical && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Crítico
                      </Badge>
                    )}
                    {lead.is_sindico && (
                      <Badge variant="secondary">Síndico</Badge>
                    )}
                  </div>
                </div>

                {/* Seção de Classificação */}
                <div className="glass-card p-4 rounded-lg space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    📋 Classificação
                  </h4>

                  <div className="space-y-2">
                    <Label>Tipo de Contato</Label>
                    <div className="flex gap-2">
                      <Select
                        value={lead.contact_type || 'unknown'}
                        onValueChange={updateLeadType}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {contactTypes.map((type) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowTypeManager(true)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="sindico-toggle">É Síndico</Label>
                    <Switch
                      id="sindico-toggle"
                      checked={lead.is_sindico}
                      onCheckedChange={toggleSindico}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="hotlead-toggle">Hot Lead</Label>
                    <Switch
                      id="hotlead-toggle"
                      checked={lead.is_hot_lead}
                      onCheckedChange={toggleHotLead}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Lead Score</Label>
                      <span className="text-sm font-medium">{lead.lead_score || 0}/100</span>
                    </div>
                    <Slider
                      value={[lead.lead_score || 0]}
                      onValueChange={(values) => updateLeadScore(values[0])}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Métricas em Tempo Real */}
                {metrics && (
                  <div className="glass-card p-4 rounded-lg space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      📊 Métricas
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Primeiro contato</p>
                        <p className="text-sm font-medium">{metrics.firstContactFormatted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Último contato</p>
                        <p className="text-sm font-medium">
                          {metrics.lastContactFormatted}
                          {metrics.daysSinceLastContact > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (há {metrics.daysSinceLastContact}d)
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tempo médio resposta</p>
                        <p className="text-sm font-medium">{metrics.avgResponseTimeFormatted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total de mensagens</p>
                        <p className="text-sm font-medium">{metrics.totalMessages}</p>
                      </div>
                      {lead.mood_score && (
                        <div>
                          <p className="text-xs text-muted-foreground">Humor detectado</p>
                          <p className="text-sm font-medium">😊 {lead.mood_score}/100</p>
                        </div>
                      )}
                      {lead.urgency_level && (
                        <div>
                          <p className="text-xs text-muted-foreground">Urgência</p>
                          <p className="text-sm font-medium">⚠️ {lead.urgency_level}/10</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="glass-card p-4 rounded-lg">
                  <ConversationTags
                    phoneNumber={lead.contact_phone}
                    agentKey={lead.agent_key}
                  />
                </div>

                {/* Notas */}
                <div className="glass-card p-4 rounded-lg">
                  <ConversationNotes
                    phoneNumber={lead.contact_phone}
                    agentKey={lead.agent_key}
                  />
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Dialog de Gerenciamento de Tipos */}
      <ContactTypeManager
        open={showTypeManager}
        onClose={() => setShowTypeManager(false)}
      />
    </>
  );
};