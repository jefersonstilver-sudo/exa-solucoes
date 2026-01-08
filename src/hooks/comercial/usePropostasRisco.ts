import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PropostaRisco {
  id: string;
  client_name: string;
  valor: number;
  status: string;
  dias_parado: number;
  expires_at?: string;
  sent_at?: string;
  tipo_risco: 'vencendo' | 'sem_resposta' | 'aceita_sem_avanco';
}

export const usePropostasRisco = () => {
  const [propostas, setPropostas] = useState<PropostaRisco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPropostasRisco = async () => {
    try {
      setLoading(true);
      const riscos: PropostaRisco[] = [];
      const hoje = new Date();
      const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const cincoDiasAtras = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Propostas vencendo hoje ou amanhã
      const { data: vencendo, error: errVencendo } = await supabase
        .from('proposals')
        .select('id, client_name, cash_total_value, status, expires_at, sent_at')
        .in('status', ['enviada', 'visualizada', 'atualizada'])
        .lte('expires_at', amanha)
        .order('expires_at', { ascending: true })
        .limit(5);

      if (!errVencendo && vencendo) {
        vencendo.forEach(p => {
          riscos.push({
            id: p.id,
            client_name: p.client_name || 'Cliente',
            valor: p.cash_total_value || 0,
            status: p.status || '',
            dias_parado: p.expires_at 
              ? Math.ceil((new Date(p.expires_at).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
              : 0,
            expires_at: p.expires_at || undefined,
            sent_at: p.sent_at || undefined,
            tipo_risco: 'vencendo'
          });
        });
      }

      // 2. Propostas sem resposta há mais de 5 dias
      const { data: semResposta, error: errSemResposta } = await supabase
        .from('proposals')
        .select('id, client_name, cash_total_value, status, expires_at, sent_at')
        .in('status', ['enviada', 'atualizada'])
        .lt('sent_at', cincoDiasAtras)
        .order('sent_at', { ascending: true })
        .limit(5);

      if (!errSemResposta && semResposta) {
        semResposta.forEach(p => {
          // Evitar duplicatas
          if (!riscos.find(r => r.id === p.id)) {
            riscos.push({
              id: p.id,
              client_name: p.client_name || 'Cliente',
              valor: p.cash_total_value || 0,
              status: p.status || '',
              dias_parado: p.sent_at 
                ? Math.floor((hoje.getTime() - new Date(p.sent_at).getTime()) / (1000 * 60 * 60 * 24))
                : 0,
              expires_at: p.expires_at || undefined,
              sent_at: p.sent_at || undefined,
              tipo_risco: 'sem_resposta'
            });
          }
        });
      }

      // 3. Propostas aceitas sem avanço (sem venda criada)
      const { data: aceitas, error: errAceitas } = await supabase
        .from('proposals')
        .select('id, client_name, cash_total_value, status, updated_at')
        .eq('status', 'aceita')
        .order('updated_at', { ascending: true })
        .limit(5);

      if (!errAceitas && aceitas) {
        for (const p of aceitas) {
          const { count } = await supabase
            .from('vendas')
            .select('id', { count: 'exact', head: true })
            .eq('proposta_id', p.id);
          
          if (!count || count === 0) {
            riscos.push({
              id: p.id,
              client_name: p.client_name || 'Cliente',
              valor: p.cash_total_value || 0,
              status: p.status || '',
              dias_parado: p.updated_at 
                ? Math.floor((hoje.getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24))
                : 0,
              tipo_risco: 'aceita_sem_avanco'
            });
          }
        }
      }

      // Ordenar por tipo de risco (críticos primeiro)
      riscos.sort((a, b) => {
        const ordem = { 'aceita_sem_avanco': 0, 'vencendo': 1, 'sem_resposta': 2 };
        return (ordem[a.tipo_risco] || 99) - (ordem[b.tipo_risco] || 99);
      });

      setPropostas(riscos.slice(0, 10));

    } catch (err) {
      console.error('Erro ao buscar propostas em risco:', err);
      setError('Erro ao carregar propostas em risco');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropostasRisco();

    const channel = supabase
      .channel('propostas-risco')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, fetchPropostasRisco)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendas' }, fetchPropostasRisco)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { propostas, loading, error, refetch: fetchPropostasRisco };
};
