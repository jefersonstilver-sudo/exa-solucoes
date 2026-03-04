import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Moon, Sun, Clock, MessageSquare, Users, ExternalLink } from 'lucide-react';
import { useAgendaNotificationSettings, type AgendaConfigKey, type AgendaNotificationConfig } from '@/hooks/tarefas/useAgendaNotificationSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ManageAlertContactsModal from '@/components/admin/agenda/ManageAlertContactsModal';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AgendaNotificationSettingsModal = ({ open, onOpenChange }: Props) => {
  const { configs, isLoading, isSaving, getConfig, saveConfig } = useAgendaNotificationSettings();
  const [contactsModalOpen, setContactsModalOpen] = useState(false);

  // Local state for each config section
  const [localConfigs, setLocalConfigs] = useState<Record<AgendaConfigKey, AgendaNotificationConfig> | null>(null);

  useEffect(() => {
    if (configs) {
      setLocalConfigs({ ...configs });
    }
  }, [configs]);

  const { data: activeContacts } = useQuery({
    queryKey: ['agenda-alert-contacts-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exa_alerts_directors')
        .select('id, nome, telefone, ativo')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const handleToggle = (key: AgendaConfigKey, checked: boolean) => {
    if (!localConfigs) return;
    const updated = { ...localConfigs[key], ativo: checked };
    setLocalConfigs({ ...localConfigs, [key]: updated });
    saveConfig(key, updated);
  };

  const handleValueChange = (key: AgendaConfigKey, field: string, value: string | number) => {
    if (!localConfigs) return;
    const updated = { ...localConfigs[key], [field]: value };
    setLocalConfigs({ ...localConfigs, [key]: updated });
  };

  const handleSaveField = (key: AgendaConfigKey) => {
    if (!localConfigs) return;
    saveConfig(key, localConfigs[key]);
  };

  if (!localConfigs && isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const sections = [
    {
      key: 'agenda_relatorio_noturno' as AgendaConfigKey,
      icon: <Moon className="h-4 w-4" />,
      title: 'Relatório Diário Noturno',
      description: 'Resume os eventos registrados no dia e pendentes não concluídos',
      fieldLabel: 'Horário de envio',
      fieldKey: 'horario',
      fieldType: 'time' as const,
      defaultBadge: '19:00',
    },
    {
      key: 'agenda_relatorio_matinal' as AgendaConfigKey,
      icon: <Sun className="h-4 w-4" />,
      title: 'Relatório Matinal',
      description: 'Envia pendentes do dia anterior + agenda do dia atual',
      fieldLabel: 'Horário de envio',
      fieldKey: 'horario',
      fieldType: 'time' as const,
      defaultBadge: '08:00',
    },
    {
      key: 'agenda_lembrete_pre_evento' as AgendaConfigKey,
      icon: <Clock className="h-4 w-4" />,
      title: 'Lembrete Antes do Evento',
      description: 'Envia lembrete WhatsApp X minutos antes de cada evento',
      fieldLabel: 'Minutos antes',
      fieldKey: 'minutos_antes',
      fieldType: 'number' as const,
      defaultBadge: '60 min',
    },
    {
      key: 'agenda_followup_pos_evento' as AgendaConfigKey,
      icon: <MessageSquare className="h-4 w-4" />,
      title: 'Follow-up Pós-Evento',
      description: 'Cobra conclusão/reagendamento X minutos após horário do evento',
      fieldLabel: 'Minutos após',
      fieldKey: 'minutos_apos',
      fieldType: 'number' as const,
      defaultBadge: '60 min',
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-2xl border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base font-semibold">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              Configurações de Notificações
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure os relatórios automáticos e lembretes da agenda via WhatsApp
            </DialogDescription>
          </DialogHeader>

          <Accordion type="multiple" defaultValue={sections.map(s => s.key)} className="space-y-1">
            {sections.map((section) => {
              const config = localConfigs?.[section.key];
              const isActive = config?.ativo ?? false;
              const fieldValue = config?.[section.fieldKey as keyof AgendaNotificationConfig];

              return (
                <AccordionItem
                  key={section.key}
                  value={section.key}
                  className="border border-border/40 rounded-lg px-4 bg-card/50 backdrop-blur-sm data-[state=open]:bg-card/80 transition-colors"
                >
                  <AccordionTrigger className="py-3 hover:no-underline gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-1.5 rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {section.icon}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{section.title}</span>
                          <Badge
                            variant={isActive ? 'default' : 'secondary'}
                            className="text-[10px] px-1.5 py-0 h-4"
                          >
                            {isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <p className="text-xs text-muted-foreground mb-3">
                      {section.description}
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={isActive}
                          onCheckedChange={(checked) => handleToggle(section.key, checked)}
                          disabled={isSaving}
                        />
                        <Label className="text-xs text-muted-foreground">
                          {isActive ? 'Ativado' : 'Desativado'}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">
                          {section.fieldLabel}
                        </Label>
                        <Input
                          type={section.fieldType}
                          value={fieldValue as string ?? ''}
                          onChange={(e) => handleValueChange(
                            section.key,
                            section.fieldKey,
                            section.fieldType === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                          )}
                          onBlur={() => handleSaveField(section.key)}
                          className="h-8 w-24 text-xs text-center"
                          disabled={!isActive || isSaving}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}

            {/* Destinatários */}
            <AccordionItem
              value="destinatarios"
              className="border border-border/40 rounded-lg px-4 bg-card/50 backdrop-blur-sm data-[state=open]:bg-card/80 transition-colors"
            >
              <AccordionTrigger className="py-3 hover:no-underline gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Destinatários Padrão</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        {activeContacts?.length || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Pessoas que recebem os relatórios diários automaticamente
                </p>
                {activeContacts && activeContacts.length > 0 ? (
                  <div className="space-y-1.5 mb-3">
                    {activeContacts.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 text-xs text-foreground/80">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="font-medium">{c.nome}</span>
                        <span className="text-muted-foreground">
                          {c.telefone?.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/60 mb-3 italic">
                    Nenhum contato ativo cadastrado
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setContactsModalOpen(true)}
                >
                  <ExternalLink className="h-3 w-3" />
                  Gerenciar Contatos
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </DialogContent>
      </Dialog>

      <ManageAlertContactsModal
        open={contactsModalOpen}
        onOpenChange={setContactsModalOpen}
      />
    </>
  );
};

export default AgendaNotificationSettingsModal;
