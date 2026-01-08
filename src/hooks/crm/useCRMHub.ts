import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ClientCRM, CRMHubFilters, CRMHubMetrics, FunilStatus, FUNIL_COLUMNS } from '@/types/crm';
import { useAuth } from '@/hooks/useAuth';

export const useCRMHub = (filters?: CRMHubFilters) => {
  const [clients, setClients] = useState<ClientCRM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile, isSuperAdmin } = useAuth();

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('contacts')
        .select(`
          id,
          nome,
          sobrenome,
          empresa,
          telefone,
          email,
          categoria,
          funil_status,
          temperatura,
          origem,
          responsavel_id,
          conversation_id,
          created_at,
          updated_at,
          last_interaction_at,
          metadata,
          tags
        `)
        .order('updated_at', { ascending: false });

      // Filtros
      if (filters?.funilStatus) {
        query = query.eq('funil_status', filters.funilStatus);
      }
      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria);
      }
      if (filters?.responsavelId) {
        query = query.eq('responsavel_id', filters.responsavelId);
      }
      if (filters?.temperatura) {
        query = query.eq('temperatura', filters.temperatura);
      }
      if (filters?.search) {
        query = query.or(`nome.ilike.%${filters.search}%,empresa.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Map data to ClientCRM with default funil_status
      const mappedData: ClientCRM[] = (data || []).map((item: any) => ({
        ...item,
        funil_status: item.funil_status || 'lead',
        pontuacao: 0
      }));

      setClients(mappedData);
    } catch (err) {
      console.error('Erro ao buscar clientes CRM:', err);
      setError('Erro ao carregar dados do CRM');
      toast.error('Erro ao carregar dados do CRM');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Métricas calculadas
  const metrics: CRMHubMetrics = useMemo(() => {
    const leads = clients.filter(c => c.funil_status === 'lead').length;
    const oportunidades = clients.filter(c => c.funil_status === 'oportunidade').length;
    const clientesCount = clients.filter(c => c.funil_status === 'cliente').length;
    const churn = clients.filter(c => c.funil_status === 'churn').length;
    const total = clients.length;
    
    return {
      totalContatos: total,
      leads,
      oportunidades,
      clientes: clientesCount,
      churn,
      conversaoRate: total > 0 ? Math.round((clientesCount / total) * 100) : 0
    };
  }, [clients]);

  // Colunas do funil com contagens
  const funilColumns = useMemo(() => {
    return FUNIL_COLUMNS.map(col => ({
      ...col,
      count: clients.filter(c => c.funil_status === col.id).length
    }));
  }, [clients]);

  // Atualizar status do funil
  const updateFunilStatus = useCallback(async (clientId: string, newStatus: FunilStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ 
          funil_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (updateError) throw updateError;

      // Atualização otimista
      setClients(prev => prev.map(c => 
        c.id === clientId ? { ...c, funil_status: newStatus } : c
      ));

      toast.success(`Status atualizado para ${newStatus}`);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Erro ao atualizar status');
      fetchClients();
    }
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    metrics,
    funilColumns,
    fetchClients,
    updateFunilStatus
  };
};
