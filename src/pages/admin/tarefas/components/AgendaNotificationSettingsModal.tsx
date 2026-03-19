import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Moon, Sun, Clock, MessageSquare, Users, ChevronRight, Loader2 } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgendaNotificationSettings, type AgendaConfigKey, type AgendaNotificationConfig } from '@/hooks/tarefas/useAgendaNotificationSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ManageAlertContactsModal from '@/components/admin/agenda/ManageAlertContactsModal';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// iOS-style icon circle
const IconCircle = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <div
    className="flex items-center justify-center rounded-[10px] shrink-0"
    style={{
      width: 32,
      height: 32,
      background: color,
    }}
  >
    {children}
  </div>
);

// Status dot
const StatusDot = ({ active }: { active: boolean }) => (
  <div
    className={`h-2 w-2 rounded-full shrink-0 transition-colors duration-300 ${
      active ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground/30'
    }`}
  />
);

// Avatar circle for contacts
const AvatarCircle = ({ name }: { name: string }) => {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="h-10 w-10 rounded-full bg-primary/10 border border-border/50 flex items-center justify-center">
        <span className="text-xs font-semibold text-primary">{initials}</span>
      </div>
      <span className="text-[11px] text-muted-foreground max-w-[56px] truncate text-center leading-tight">
        {name.split(' ')[0]}
      </span>
    </div>
  );
};

const AgendaNotificationSettingsModal = ({ open, onOpenChange }: Props) => {
  const { configs, isLoading, isSaving, getConfig, saveConfig } = useAgendaNotificationSettings();
  const [contactsModalOpen, setContactsModalOpen] = useState(false);
  const [localConfigs, setLocalConfigs] = useState<Record<AgendaConfigKey, AgendaNotificationConfig> | null>(null);
  const isMobile = useIsMobile();

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

  const sections = [
    {
      key: 'agenda_relatorio_noturno' as AgendaConfigKey,
      icon: <Moon className="h-4 w-4 text-white" />,
      iconColor: '#6366F1',
      title: 'Relatório Noturno',
      description: 'Resume eventos do dia e pendentes',
      fieldLabel: 'Horário',
      fieldKey: 'horario',
      fieldType: 'time' as const,
    },
    {
      key: 'agenda_relatorio_matinal' as AgendaConfigKey,
      icon: <Sun className="h-4 w-4 text-white" />,
      iconColor: '#F59E0B',
      title: 'Relatório Matinal',
      description: 'Pendentes anteriores + agenda do dia',
      fieldLabel: 'Horário',
      fieldKey: 'horario',
      fieldType: 'time' as const,
    },
    {
      key: 'agenda_lembrete_pre_evento' as AgendaConfigKey,
      icon: <Clock className="h-4 w-4 text-white" />,
      iconColor: '#10B981',
      title: 'Lembrete Pré-Evento',
      description: 'Alerta antes de cada compromisso',
      fieldLabel: 'Min. antes',
      fieldKey: 'minutos_antes',
      fieldType: 'number' as const,
    },
    {
      key: 'agenda_followup_pos_evento' as AgendaConfigKey,
      icon: <MessageSquare className="h-4 w-4 text-white" />,
      iconColor: '#EF4444',
      title: 'Follow-up Pós-Evento',
      description: 'Cobra conclusão após o evento',
      fieldLabel: 'Min. após',
      fieldKey: 'minutos_apos',
      fieldType: 'number' as const,
    },
  ];

  // Shared content
  const renderContent = () => {
    if (isLoading || !localConfigs) {
      return (
        <div className="space-y-3 p-4 sm:p-0">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
          <Skeleton className="h-[100px] w-full rounded-xl" />
        </div>
      );
    }

    return (
      <div
        className="space-y-2 px-4 sm:px-0 pb-8 sm:pb-0"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Notification sections */}
        {sections.map((section) => {
          const config = localConfigs[section.key];
          const isActive = config?.ativo ?? false;
          const fieldValue = config?.[section.fieldKey as keyof AgendaNotificationConfig];

          return (
            <div
              key={section.key}
              className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden transition-all duration-200"
            >
              {/* Row: icon + title + status dot + toggle */}
              <div className="flex items-center gap-3 px-4 min-h-[56px]">
                <IconCircle color={section.iconColor}>{section.icon}</IconCircle>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-foreground leading-tight">
                      {section.title}
                    </span>
                    <StatusDot active={isActive} />
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-tight mt-0.5">
                    {section.description}
                  </p>
                </div>
                <ToggleExa
                  checked={isActive}
                  onChange={(checked) => handleToggle(section.key, checked)}
                  disabled={isSaving}
                  color="red"
                />
              </div>

              {/* Inline field - only show when active */}
              {isActive && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/30">
                  <span className="text-[13px] text-muted-foreground">{section.fieldLabel}</span>
                  <Input
                    type={section.fieldType}
                    value={fieldValue as string ?? ''}
                    onChange={(e) =>
                      handleValueChange(
                        section.key,
                        section.fieldKey,
                        section.fieldType === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                      )
                    }
                    onBlur={() => handleSaveField(section.key)}
                    className="h-9 w-24 text-sm text-center rounded-lg border-border/50 bg-background"
                    disabled={isSaving}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Recipients section */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setContactsModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 min-h-[56px] active:bg-muted/50 transition-colors"
          >
            <IconCircle color="#8B5CF6">
              <Users className="h-4 w-4 text-white" />
            </IconCircle>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-foreground leading-tight">
                  Destinatários
                </span>
                <span className="text-[12px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {activeContacts?.length || 0}
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-tight mt-0.5">
                Quem recebe os relatórios automáticos
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
          </button>

          {/* Avatars row */}
          {activeContacts && activeContacts.length > 0 && (
            <div className="px-4 pb-4 pt-1 border-t border-border/30">
              <div className="flex gap-3 overflow-x-auto py-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                {activeContacts.map((c) => (
                  <AvatarCircle key={c.id} name={c.nome} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Mobile: Drawer (bottom sheet)
  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
          <DrawerContent className="max-h-[92vh] bg-background">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-base font-semibold text-center">
                Notificações da Agenda
              </DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground text-center">
                Configure alertas automáticos via WhatsApp
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              {renderContent()}
            </div>
          </DrawerContent>
        </Drawer>

        <ManageAlertContactsModal
          open={contactsModalOpen}
          onOpenChange={setContactsModalOpen}
        />
      </>
    );
  }

  // Desktop: Dialog
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-background border-border/50">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Notificações da Agenda
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure alertas automáticos via WhatsApp
            </DialogDescription>
          </DialogHeader>
          {renderContent()}
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
