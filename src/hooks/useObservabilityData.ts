import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ObservabilityMetrics {
  totalMessagesToday: number;
  outboundMessages: number;
  inboundMessages: number;
  pendingDelivery: number;
  deliveryFailures: number;
  suspectedFailures: number;
  activeAlerts: number;
  replaysToday: number;
  openCircuitBreakers: number;
}

export interface MessageWithTrace {
  id: string;
  conversation_id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  delivery_status: string | null;
  delivery_retry_count: number | null;
  created_at: string;
  external_message_id: string | null;
  agent_key: string | null;
}

export interface SystemAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  metadata: Record<string, any> | null;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface ReplayAuditEntry {
  id: string;
  original_message_id: string;
  new_message_id: string | null;
  replayed_by: string;
  reason: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface CircuitBreakerStatus {
  id: string;
  agent_key: string;
  state: string;
  failure_count: number;
  last_failure_at: string | null;
  opened_at: string | null;
  cooldown_until: string | null;
  updated_at: string;
}

export interface MessagesByHour {
  hour: string;
  inbound: number;
  outbound: number;
}

export interface DeliveryStatusDistribution {
  status: string;
  count: number;
}

// Hook principal de observabilidade
export const useObservabilityData = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  // Métricas gerais
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['observability-metrics'],
    queryFn: async (): Promise<ObservabilityMetrics> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Total de mensagens hoje
      const { count: totalMessagesToday } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO);

      // Mensagens outbound
      const { count: outboundMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('direction', 'outbound')
        .gte('created_at', todayISO);

      // Mensagens inbound
      const { count: inboundMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('direction', 'inbound')
        .gte('created_at', todayISO);

      // Pendentes de entrega
      const { count: pendingDelivery } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('delivery_status', 'pending')
        .eq('direction', 'outbound');

      // Falhas de entrega
      const { count: deliveryFailures } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('delivery_status', 'failed');

      // Falhas suspeitas
      const { count: suspectedFailures } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('delivery_status', 'suspected_delivery_failure');

      // Alertas ativos
      const { count: activeAlerts } = await supabase
        .from('system_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('acknowledged', false);

      // Replays hoje
      const { count: replaysToday } = await supabase
        .from('replay_audit')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO);

      // Circuit breakers abertos
      const { count: openCircuitBreakers } = await supabase
        .from('delivery_circuit_breaker')
        .select('*', { count: 'exact', head: true })
        .eq('is_open', true);

      return {
        totalMessagesToday: totalMessagesToday || 0,
        outboundMessages: outboundMessages || 0,
        inboundMessages: inboundMessages || 0,
        pendingDelivery: pendingDelivery || 0,
        deliveryFailures: deliveryFailures || 0,
        suspectedFailures: suspectedFailures || 0,
        activeAlerts: activeAlerts || 0,
        replaysToday: replaysToday || 0,
        openCircuitBreakers: openCircuitBreakers || 0,
      };
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Mensagens com filtros
  const useMessages = (filters?: {
    phone?: string;
    agentKey?: string;
    deliveryStatus?: string;
    direction?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    return useQuery({
      queryKey: ['observability-messages', filters],
      queryFn: async (): Promise<MessageWithTrace[]> => {
      let query = supabase
        .from('messages')
        .select('id, conversation_id, body, direction, delivery_status, delivery_retry_count, created_at, external_message_id, agent_key')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.agentKey) {
        query = query.eq('agent_key', filters.agentKey);
      }
        if (filters?.deliveryStatus) {
          query = query.eq('delivery_status', filters.deliveryStatus);
        }
        if (filters?.direction) {
          query = query.eq('direction', filters.direction);
        }
        if (filters?.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as MessageWithTrace[];
      },
    });
  };

  // Alertas do sistema
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['observability-alerts'],
    queryFn: async (): Promise<SystemAlert[]> => {
      const { data, error } = await supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as SystemAlert[];
    },
    refetchInterval: 15000,
  });

  // Mutation para acknowledge de alerta
  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('system_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: session?.user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observability-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['observability-metrics'] });
      toast.success('Alerta reconhecido');
    },
    onError: (error) => {
      toast.error('Erro ao reconhecer alerta: ' + error.message);
    },
  });

  // Histórico de replays
  const { data: replays, isLoading: replaysLoading, refetch: refetchReplays } = useQuery({
    queryKey: ['observability-replays'],
    queryFn: async (): Promise<ReplayAuditEntry[]> => {
      const { data, error } = await supabase
        .from('replay_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as ReplayAuditEntry[];
    },
  });

  // Status dos circuit breakers
  const { data: circuitBreakers, isLoading: circuitBreakersLoading } = useQuery({
    queryKey: ['observability-circuit-breakers'],
    queryFn: async (): Promise<CircuitBreakerStatus[]> => {
      const { data, error } = await supabase
        .from('delivery_circuit_breaker')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as CircuitBreakerStatus[];
    },
    refetchInterval: 30000,
  });

  // Mensagens por hora (últimas 24h)
  const { data: messagesByHour } = useQuery({
    queryKey: ['observability-messages-by-hour'],
    queryFn: async (): Promise<MessagesByHour[]> => {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data, error } = await supabase
        .from('messages')
        .select('direction, created_at')
        .gte('created_at', twentyFourHoursAgo.toISOString());

      if (error) throw error;

      // Agrupar por hora
      const hourMap: Record<string, { inbound: number; outbound: number }> = {};
      
      (data || []).forEach((msg: { direction: string; created_at: string }) => {
        const hour = new Date(msg.created_at).toISOString().slice(0, 13) + ':00';
        if (!hourMap[hour]) {
          hourMap[hour] = { inbound: 0, outbound: 0 };
        }
        if (msg.direction === 'inbound') {
          hourMap[hour].inbound++;
        } else {
          hourMap[hour].outbound++;
        }
      });

      return Object.entries(hourMap)
        .map(([hour, counts]) => ({ hour, ...counts }))
        .sort((a, b) => a.hour.localeCompare(b.hour));
    },
  });

  // Distribuição de status de delivery
  const { data: deliveryDistribution } = useQuery({
    queryKey: ['observability-delivery-distribution'],
    queryFn: async (): Promise<DeliveryStatusDistribution[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('delivery_status')
        .eq('direction', 'outbound')
        .not('delivery_status', 'is', null);

      if (error) throw error;

      // Contar por status
      const statusMap: Record<string, number> = {};
      (data || []).forEach((msg: { delivery_status: string | null }) => {
        const status = msg.delivery_status || 'unknown';
        statusMap[status] = (statusMap[status] || 0) + 1;
      });

      return Object.entries(statusMap).map(([status, count]) => ({ status, count }));
    },
  });

  // Mutation para executar replay
  const executeReplay = useMutation({
    mutationFn: async ({ messageId, reason }: { messageId: string; reason: string }) => {
      const { data, error } = await supabase.functions.invoke('replay-message', {
        body: { message_id: messageId, reason },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observability-replays'] });
      queryClient.invalidateQueries({ queryKey: ['observability-metrics'] });
      toast.success('Replay executado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao executar replay: ' + error.message);
    },
  });

  // Função para atualizar todos os dados
  const refetchAll = async () => {
    await Promise.all([
      refetchMetrics(),
      refetchAlerts(),
      refetchReplays(),
    ]);
    toast.success('Dashboard atualizado');
  };

  // Exportar logs para CSV
  const exportLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, body, direction, delivery_status, created_at, agent_key, sender_phone')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const csvHeader = 'ID,Conversation,Body,Direction,Delivery Status,Created At,Agent,Phone\n';
      const csvRows = (data || []).map((msg: any) => 
        `"${msg.id}","${msg.conversation_id || ''}","${(msg.body || '').replace(/"/g, '""').substring(0, 100)}","${msg.direction}","${msg.delivery_status || ''}","${msg.created_at}","${msg.agent_key || ''}","${msg.sender_phone || ''}"`
      ).join('\n');

      const csvContent = csvHeader + csvRows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `observability-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Logs exportados com sucesso');
    } catch (error) {
      toast.error('Erro ao exportar logs');
      console.error('Export error:', error);
    }
  };

  return {
    metrics: metrics || {
      totalMessagesToday: 0,
      outboundMessages: 0,
      inboundMessages: 0,
      pendingDelivery: 0,
      deliveryFailures: 0,
      suspectedFailures: 0,
      activeAlerts: 0,
      replaysToday: 0,
      openCircuitBreakers: 0,
    },
    metricsLoading,
    alerts: alerts || [],
    alertsLoading,
    replays: replays || [],
    replaysLoading,
    circuitBreakers: circuitBreakers || [],
    circuitBreakersLoading,
    messagesByHour: messagesByHour || [],
    deliveryDistribution: deliveryDistribution || [],
    acknowledgeAlert,
    executeReplay,
    refetchAll,
    exportLogs,
    useMessages,
  };
};
