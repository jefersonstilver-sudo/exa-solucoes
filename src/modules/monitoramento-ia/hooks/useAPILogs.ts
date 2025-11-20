import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface APILog {
  timestamp: string;
  status: number;
  latency: number;
  error?: string;
  endpoint: string;
}

export interface APIStats {
  totalCalls: number;
  successRate: number;
  avgLatency: number;
  lastCall: string | null;
  errorRate: number;
}

export const useAPILogs = () => {
  const [loading, setLoading] = useState(false);

  const fetchLogs = async (functionName: string, limit: number = 100): Promise<APILog[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('supabase--analytics-query', {
        body: {
          query: `
            select id, function_edge_logs.timestamp, event_message, response.status_code, 
                   request.method, m.function_id, m.execution_time_ms, m.deployment_id, m.version 
            from function_edge_logs
            cross join unnest(metadata) as m
            cross join unnest(m.response) as response
            cross join unnest(m.request) as request
            where m.function_id = '${functionName}'
            order by timestamp desc
            limit ${limit}
          `
        }
      });

      if (error) throw error;

      const logs: APILog[] = (data?.data || []).map((row: any) => ({
        timestamp: row.timestamp,
        status: row.status_code || 0,
        latency: row.execution_time_ms || 0,
        error: row.status_code >= 400 ? row.event_message : undefined,
        endpoint: functionName
      }));

      return logs;
    } catch (error) {
      console.error('Error fetching API logs:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getStats = (logs: APILog[]): APIStats => {
    if (logs.length === 0) {
      return {
        totalCalls: 0,
        successRate: 0,
        avgLatency: 0,
        lastCall: null,
        errorRate: 0
      };
    }

    const successfulCalls = logs.filter(l => l.status >= 200 && l.status < 400).length;
    const totalLatency = logs.reduce((sum, l) => sum + l.latency, 0);

    return {
      totalCalls: logs.length,
      successRate: (successfulCalls / logs.length) * 100,
      avgLatency: Math.round(totalLatency / logs.length),
      lastCall: logs[0]?.timestamp || null,
      errorRate: ((logs.length - successfulCalls) / logs.length) * 100
    };
  };

  return {
    fetchLogs,
    getStats,
    loading
  };
};
