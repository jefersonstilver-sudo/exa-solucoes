import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AgendaNotificationConfig {
  ativo: boolean;
  horario?: string;
  minutos_antes?: number;
  minutos_apos?: number;
}

const CONFIG_KEYS = [
  'agenda_relatorio_noturno',
  'agenda_relatorio_matinal',
  'agenda_lembrete_pre_evento',
  'agenda_followup_pos_evento',
] as const;

export type AgendaConfigKey = typeof CONFIG_KEYS[number];

const DEFAULTS: Record<AgendaConfigKey, AgendaNotificationConfig> = {
  agenda_relatorio_noturno: { ativo: true, horario: '19:00' },
  agenda_relatorio_matinal: { ativo: true, horario: '08:00' },
  agenda_lembrete_pre_evento: { ativo: true, minutos_antes: 60 },
  agenda_followup_pos_evento: { ativo: true, minutos_apos: 60 },
};

export const useAgendaNotificationSettings = () => {
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['agenda-notification-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exa_alerts_config')
        .select('config_key, config_value')
        .in('config_key', [...CONFIG_KEYS]);

      if (error) throw error;

      const result: Record<string, AgendaNotificationConfig> = {};
      for (const key of CONFIG_KEYS) {
        const found = data?.find(d => d.config_key === key);
        result[key] = found?.config_value
          ? (typeof found.config_value === 'string' ? JSON.parse(found.config_value) : found.config_value)
          : DEFAULTS[key];
      }
      return result as Record<AgendaConfigKey, AgendaNotificationConfig>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: AgendaConfigKey; value: AgendaNotificationConfig }) => {
      const { error } = await supabase
        .from('exa_alerts_config')
        .upsert({
          config_key: key,
          config_value: value as any,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'config_key' });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configuração salva com sucesso');
      queryClient.invalidateQueries({ queryKey: ['agenda-notification-settings'] });
    },
    onError: (err: any) => {
      toast.error(`Erro ao salvar: ${err.message}`);
    },
  });

  const getConfig = (key: AgendaConfigKey): AgendaNotificationConfig => {
    return configs?.[key] ?? DEFAULTS[key];
  };

  const saveConfig = (key: AgendaConfigKey, value: AgendaNotificationConfig) => {
    saveMutation.mutate({ key, value });
  };

  return {
    configs,
    isLoading,
    isSaving: saveMutation.isPending,
    getConfig,
    saveConfig,
    DEFAULTS,
  };
};
