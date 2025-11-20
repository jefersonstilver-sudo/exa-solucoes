import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, CheckCircle, AlertCircle } from 'lucide-react';

interface Metrics {
  totalInbound: number;
  totalOutbound: number;
  successRate: number;
  errorCount: number;
}

interface AgentMetricsProps {
  agentKey?: string;
}

export const AgentMetrics = ({ agentKey }: AgentMetricsProps) => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalInbound: 0,
    totalOutbound: 0,
    successRate: 0,
    errorCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        
        let query = supabase.from('zapi_logs').select('*');
        
        if (agentKey) {
          query = query.eq('agent_key', agentKey);
        }

        const { data, error } = await query;

        if (error) throw error;

        const inbound = data?.filter(log => log.direction === 'inbound').length || 0;
        const outbound = data?.filter(log => log.direction === 'outbound').length || 0;
        const successful = data?.filter(log => log.status === 'success').length || 0;
        const errors = data?.filter(log => log.status === 'error').length || 0;
        const total = data?.length || 0;

        setMetrics({
          totalInbound: inbound,
          totalOutbound: outbound,
          successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
          errorCount: errors,
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [agentKey]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-module-card rounded-lg border border-module p-4 animate-pulse">
            <div className="h-12 bg-module-input rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Mensagens Recebidas */}
      <div className="bg-module-card rounded-lg border border-module p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-module-secondary">Recebidas</span>
          <MessageCircle className="w-5 h-5 text-blue-500" />
        </div>
        <div className="text-2xl font-bold text-module-primary">{metrics.totalInbound}</div>
      </div>

      {/* Mensagens Enviadas */}
      <div className="bg-module-card rounded-lg border border-module p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-module-secondary">Enviadas</span>
          <Send className="w-5 h-5 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-module-primary">{metrics.totalOutbound}</div>
      </div>

      {/* Taxa de Sucesso */}
      <div className="bg-module-card rounded-lg border border-module p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-module-secondary">Taxa de Sucesso</span>
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="text-2xl font-bold text-module-primary">{metrics.successRate}%</div>
      </div>

      {/* Erros */}
      <div className="bg-module-card rounded-lg border border-module p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-module-secondary">Erros</span>
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <div className="text-2xl font-bold text-module-primary">{metrics.errorCount}</div>
      </div>
    </div>
  );
};
