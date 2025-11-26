import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export type PeriodType = 'today' | 'yesterday' | '7days' | '30days' | 'custom';

interface MessageMetrics {
  date: string;
  sent: number;
  received: number;
  avgResponseTime: number;
}

interface AgentMetrics {
  agentKey: string;
  messagesSent: number;
  messagesReceived: number;
  avgResponseTime: number;
}

interface DetailedMetrics {
  messagesByDay: MessageMetrics[];
  agentMetrics: AgentMetrics[];
  totalSent: number;
  totalReceived: number;
  avgResponseTimeContact: number;
  avgResponseTimeAgent: number;
  loading: boolean;
}

export const useLeadMetricsDetailed = (
  conversationId: string | null,
  period: PeriodType = 'today',
  customStart?: Date,
  customEnd?: Date
) => {
  const [metrics, setMetrics] = useState<DetailedMetrics>({
    messagesByDay: [],
    agentMetrics: [],
    totalSent: 0,
    totalReceived: 0,
    avgResponseTimeContact: 0,
    avgResponseTimeAgent: 0,
    loading: true
  });

  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (period) {
      case 'today':
        start = startOfDay(now);
        break;
      case 'yesterday':
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
        break;
      case '7days':
        start = startOfDay(subDays(now, 7));
        break;
      case '30days':
        start = startOfDay(subDays(now, 30));
        break;
      case 'custom':
        start = customStart ? startOfDay(customStart) : startOfDay(now);
        end = customEnd ? endOfDay(customEnd) : endOfDay(now);
        break;
      default:
        start = startOfDay(now);
    }

    return { start, end };
  };

  const fetchMetrics = async () => {
    if (!conversationId) return;

    setMetrics(prev => ({ ...prev, loading: true }));

    try {
      const { start, end } = getDateRange();

      // Buscar mensagens do período
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Calcular métricas por dia
      const messagesByDay: Record<string, MessageMetrics> = {};
      const agentMetrics: Record<string, AgentMetrics> = {};
      let totalSent = 0;
      let totalReceived = 0;
      let contactResponseTimes: number[] = [];
      let agentResponseTimes: number[] = [];

      messages?.forEach((msg, idx) => {
        const day = format(new Date(msg.created_at), 'yyyy-MM-dd');
        
        if (!messagesByDay[day]) {
          messagesByDay[day] = {
            date: day,
            sent: 0,
            received: 0,
            avgResponseTime: 0
          };
        }

        // Mensagens enviadas vs recebidas (usar direction)
        if (msg.direction === 'outbound') {
          messagesByDay[day].sent++;
          totalSent++;
        } else {
          messagesByDay[day].received++;
          totalReceived++;
        }

        // Métricas por agente
        const agentKey = msg.agent_key || 'unknown';
        if (!agentMetrics[agentKey]) {
          agentMetrics[agentKey] = {
            agentKey,
            messagesSent: 0,
            messagesReceived: 0,
            avgResponseTime: 0
          };
        }

        if (msg.direction === 'outbound') {
          agentMetrics[agentKey].messagesSent++;
        } else {
          agentMetrics[agentKey].messagesReceived++;
        }

        // Calcular tempo de resposta
        if (idx > 0) {
          const prevMsg = messages[idx - 1];
          const timeDiff = new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime();
          const minutes = timeDiff / (1000 * 60);

          if (prevMsg.direction !== msg.direction && minutes < 60) {
            if (msg.direction === 'outbound') {
              agentResponseTimes.push(minutes);
            } else {
              contactResponseTimes.push(minutes);
            }
          }
        }
      });

      // Calcular médias
      const avgResponseTimeContact = contactResponseTimes.length > 0
        ? contactResponseTimes.reduce((a, b) => a + b, 0) / contactResponseTimes.length
        : 0;

      const avgResponseTimeAgent = agentResponseTimes.length > 0
        ? agentResponseTimes.reduce((a, b) => a + b, 0) / agentResponseTimes.length
        : 0;

      setMetrics({
        messagesByDay: Object.values(messagesByDay),
        agentMetrics: Object.values(agentMetrics),
        totalSent,
        totalReceived,
        avgResponseTimeContact,
        avgResponseTimeAgent,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching detailed metrics:', error);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [conversationId, period, customStart, customEnd]);

  return {
    ...metrics,
    refetch: fetchMetrics
  };
};
