import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ChecklistItem {
  id: string;
  tipo: 'lead_novo' | 'lead_quente' | 'proposta_vencendo' | 'proposta_aceita_sem_venda' | 'followup_hoje' | 'proposta_aguardando';
  titulo: string;
  descricao: string;
  prioridade: 'urgente' | 'importante' | 'normal';
  valor?: number;
  cliente_nome?: string;
  cliente_id?: string;
  dias_parado?: number;
  link_acao: string;
  created_at?: string;
}

export interface ChecklistComercialData {
  urgentes: ChecklistItem[];
  importantes: ChecklistItem[];
  normais: ChecklistItem[];
  total: number;
}

export const useChecklistComercial = () => {
  const { userProfile, isSuperAdmin } = useAuth();
  const [data, setData] = useState<ChecklistComercialData>({
    urgentes: [],
    importantes: [],
    normais: [],
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      const items: ChecklistItem[] = [];
      const hoje = new Date().toISOString().split('T')[0];
      const tresdiasAtras = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 1. Leads novos sem contato hoje (contatos criados hoje com funil_status = 'lead')
      const { data: leadsNovos, error: errLeads } = await supabase
        .from('contacts')
        .select('id, nome, empresa, created_at')
        .eq('funil_status', 'lead')
        .gte('created_at', hoje)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!errLeads && leadsNovos) {
        leadsNovos.forEach(lead => {
          items.push({
            id: `lead_novo_${lead.id}`,
            tipo: 'lead_novo',
            titulo: 'Lead novo sem contato',
            descricao: `${lead.nome}${lead.empresa ? ` - ${lead.empresa}` : ''}`,
            prioridade: 'urgente',
            cliente_nome: lead.nome || '',
            cliente_id: lead.id,
            link_acao: `/super_admin/contatos/${lead.id}`,
            created_at: lead.created_at
          });
        });
      }

      // 2. Leads quentes sem resposta há +3 dias
      const { data: leadsQuentes, error: errQuentes } = await supabase
        .from('contacts')
        .select('id, nome, empresa, last_contact_at, temperatura')
        .eq('funil_status', 'lead')
        .in('temperatura', ['quente', 'morno'])
        .lt('last_contact_at', tresdiasAtras)
        .order('last_contact_at', { ascending: true })
        .limit(10);

      if (!errQuentes && leadsQuentes) {
        leadsQuentes.forEach(lead => {
          const diasParado = lead.last_contact_at 
            ? Math.floor((Date.now() - new Date(lead.last_contact_at).getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          items.push({
            id: `lead_quente_${lead.id}`,
            tipo: 'lead_quente',
            titulo: `Lead ${lead.temperatura || 'quente'} sem resposta`,
            descricao: `${lead.nome}${lead.empresa ? ` - ${lead.empresa}` : ''} (${diasParado} dias)`,
            prioridade: 'urgente',
            cliente_nome: lead.nome || '',
            cliente_id: lead.id,
            dias_parado: diasParado,
            link_acao: `/super_admin/contatos/${lead.id}`
          });
        });
      }

      // 3. Propostas vencendo hoje ou amanhã
      const { data: propostasVencendo, error: errVencendo } = await supabase
        .from('proposals')
        .select('id, client_name, cash_total_value, expires_at, status')
        .in('status', ['enviada', 'visualizada', 'atualizada'])
        .gte('expires_at', hoje)
        .lte('expires_at', amanha)
        .order('expires_at', { ascending: true })
        .limit(10);

      if (!errVencendo && propostasVencendo) {
        propostasVencendo.forEach(proposta => {
          items.push({
            id: `proposta_vencendo_${proposta.id}`,
            tipo: 'proposta_vencendo',
            titulo: 'Proposta vencendo',
            descricao: `${proposta.client_name} - R$ ${(proposta.cash_total_value || 0).toLocaleString('pt-BR')}`,
            prioridade: 'urgente',
            valor: proposta.cash_total_value || 0,
            cliente_nome: proposta.client_name || '',
            link_acao: `/super_admin/propostas/${proposta.id}`
          });
        });
      }

      // 4. Propostas aceitas sem venda criada (CRÍTICO)
      const { data: propostasAceitas, error: errAceitas } = await supabase
        .from('proposals')
        .select('id, client_name, cash_total_value, updated_at')
        .eq('status', 'aceita')
        .order('updated_at', { ascending: true })
        .limit(10);

      if (!errAceitas && propostasAceitas) {
        // Verificar quais não têm venda vinculada
        for (const proposta of propostasAceitas) {
          const { count } = await supabase
            .from('vendas')
            .select('id', { count: 'exact', head: true })
            .eq('proposta_id', proposta.id);
          
          if (!count || count === 0) {
            const diasParado = proposta.updated_at 
              ? Math.floor((Date.now() - new Date(proposta.updated_at).getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            items.push({
              id: `proposta_aceita_${proposta.id}`,
              tipo: 'proposta_aceita_sem_venda',
              titulo: '⚠️ CRÍTICO: Proposta aceita sem venda',
              descricao: `${proposta.client_name} - R$ ${(proposta.cash_total_value || 0).toLocaleString('pt-BR')}`,
              prioridade: 'urgente',
              valor: proposta.cash_total_value || 0,
              cliente_nome: proposta.client_name || '',
              dias_parado: diasParado,
              link_acao: `/super_admin/propostas/${proposta.id}`
            });
          }
        }
      }

      // 5. Follow-ups agendados para hoje (tarefas do Notion)
      const { data: followups, error: errFollowups } = await supabase
        .from('notion_tasks')
        .select('id, nome, categoria, data, notion_url')
        .eq('data', hoje)
        .not('status', 'in', '("Concluído","REALIZADO")')
        .limit(10);

      if (!errFollowups && followups) {
        followups.forEach(task => {
          items.push({
            id: `followup_${task.id}`,
            tipo: 'followup_hoje',
            titulo: 'Follow-up agendado',
            descricao: task.nome || 'Tarefa do dia',
            prioridade: 'importante',
            link_acao: task.notion_url || '/super_admin/minha-manha'
          });
        });
      }

      // 6. Propostas aguardando resposta
      const { data: propostasAguardando, error: errAguardando } = await supabase
        .from('proposals')
        .select('id, client_name, cash_total_value, sent_at, status')
        .in('status', ['enviada', 'visualizada', 'atualizada'])
        .order('sent_at', { ascending: true })
        .limit(10);

      if (!errAguardando && propostasAguardando) {
        propostasAguardando.forEach(proposta => {
          const diasParado = proposta.sent_at 
            ? Math.floor((Date.now() - new Date(proposta.sent_at).getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          items.push({
            id: `proposta_aguardando_${proposta.id}`,
            tipo: 'proposta_aguardando',
            titulo: 'Proposta aguardando resposta',
            descricao: `${proposta.client_name} - R$ ${(proposta.cash_total_value || 0).toLocaleString('pt-BR')} (${diasParado} dias)`,
            prioridade: diasParado > 5 ? 'importante' : 'normal',
            valor: proposta.cash_total_value || 0,
            cliente_nome: proposta.client_name || '',
            dias_parado: diasParado,
            link_acao: `/super_admin/propostas/${proposta.id}`
          });
        });
      }

      // Categorizar por prioridade
      const urgentes = items.filter(i => i.prioridade === 'urgente');
      const importantes = items.filter(i => i.prioridade === 'importante');
      const normais = items.filter(i => i.prioridade === 'normal');

      setData({
        urgentes,
        importantes,
        normais,
        total: items.length
      });

    } catch (err) {
      console.error('Erro ao buscar checklist comercial:', err);
      setError('Erro ao carregar checklist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklist();

    // Realtime subscriptions
    const channel = supabase
      .channel('checklist-comercial')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, fetchChecklist)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, fetchChecklist)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendas' }, fetchChecklist)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notion_tasks' }, fetchChecklist)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { data, loading, error, refetch: fetchChecklist };
};
