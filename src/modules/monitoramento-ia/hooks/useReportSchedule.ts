import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportConfig {
  frequency: 'diario' | 'semanal' | 'mensal';
  time: string;
  selectedDays: string[];
  selectedDirectors: string[];
  ativo: boolean;
}

interface NextTrigger {
  date: Date;
  timeLeft: string;
  hours: number;
  minutes: number;
  seconds: number;
}

export const useReportSchedule = () => {
  const [config, setConfig] = useState<ReportConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextTrigger, setNextTrigger] = useState<NextTrigger | null>(null);

  // Buscar configuração do banco
  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exa_alerts_config')
        .select('config_value')
        .eq('config_key', 'relatorio_conversas')
        .single();

      if (error) throw error;

      if (data) {
        const configValue = data.config_value as any;
        setConfig({
          frequency: configValue.frequency || 'diario',
          time: configValue.time || '08:00',
          selectedDays: configValue.selectedDays || [],
          selectedDirectors: configValue.selectedDirectors || [],
          ativo: configValue.ativo !== undefined ? configValue.ativo : true
        });
      }
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calcular próximo disparo
  const calculateNextTrigger = useCallback(() => {
    if (!config || !config.ativo) {
      setNextTrigger(null);
      return;
    }

    const now = new Date();
    const [configHours, configMinutes] = config.time.split(':').map(Number);
    
    // Criar data para hoje no horário configurado
    let nextDate = new Date();
    nextDate.setHours(configHours, configMinutes, 0, 0);

    // Se já passou o horário de hoje, buscar próximo dia válido
    if (nextDate <= now) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    // Encontrar próximo dia válido da semana
    const dayMap: { [key: string]: number } = {
      'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6
    };

    const maxAttempts = 7; // Evitar loop infinito
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const dayOfWeek = nextDate.getDay();
      const dayKey = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek);
      
      if (dayKey && config.selectedDays.includes(dayKey)) {
        break;
      }
      
      nextDate.setDate(nextDate.getDate() + 1);
      attempts++;
    }

    // Calcular tempo restante
    const diffMs = nextDate.getTime() - now.getTime();
    const totalSeconds = Math.floor(diffMs / 1000);
    const remainingHours = Math.floor(totalSeconds / 3600);
    const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    const timeLeft = `${remainingHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

    setNextTrigger({
      date: nextDate,
      timeLeft,
      hours: remainingHours,
      minutes: remainingMinutes,
      seconds: remainingSeconds
    });
  }, [config]);

  // Atualizar status ativo/inativo
  const toggleActive = useCallback(async (newStatus: boolean) => {
    if (!config) return;

    try {
      const updatedConfig = {
        ...config,
        ativo: newStatus
      };

      const { error } = await supabase
        .from('exa_alerts_config')
        .update({
          config_value: updatedConfig,
          updated_at: new Date().toISOString()
        })
        .eq('config_key', 'relatorio_conversas');

      if (error) throw error;

      setConfig(updatedConfig);
      
      toast.success(
        newStatus ? '✅ Relatório ativado' : '⏸️ Relatório pausado',
        {
          description: newStatus 
            ? 'Os relatórios serão enviados automaticamente'
            : 'Os envios automáticos foram pausados'
        }
      );
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  }, [config]);

  // Carregar configuração inicial
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Atualizar countdown a cada segundo
  useEffect(() => {
    if (!config) return;

    calculateNextTrigger();
    const interval = setInterval(calculateNextTrigger, 1000);

    return () => clearInterval(interval);
  }, [config, calculateNextTrigger]);

  return {
    config,
    loading,
    nextTrigger,
    toggleActive,
    refetch: fetchConfig
  };
};
