import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { VendaComDetalhes, VendasFilters, VendasMetrics, StatusVenda, StatusCampanhaOperacional, StatusAssinatura, TipoAssinatura } from '@/types/vendas';

export const useVendas = (initialFilters?: VendasFilters) => {
  const { user, userProfile, isSuperAdmin } = useAuth();
  const [vendas, setVendas] = useState<VendaComDetalhes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VendasFilters>(initialFilters || { status_venda: 'todas' });
  const [metrics, setMetrics] = useState<VendasMetrics>({
    total: 0,
    em_negociacao: 0,
    ganhas: 0,
    perdidas: 0,
    valor_total_ganhas: 0,
    taxa_conversao: 0,
  });

  // Determinar o role do usuário
  const getUserRole = useCallback(() => {
    if (isSuperAdmin) return 'super_admin';
    const role = (userProfile as any)?.role || (userProfile as any)?.tipo_conta;
    return role || 'client';
  }, [isSuperAdmin, userProfile]);

  // Permissões baseadas no papel do usuário
  const getPermissionFilter = useCallback(() => {
    if (!user) return null;
    
    const role = getUserRole();
    
    // Admin e Super Admin veem tudo
    if (role === 'admin' || role === 'super_admin') {
      return {};
    }
    
    // Gerente vê vendas do time (por enquanto, todas)
    if (role === 'gerente') {
      return {};
    }
    
    // Vendedor vê apenas suas vendas
    return { responsavel_id: user.id };
  }, [user, getUserRole]);

  const fetchVendas = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // Buscar vendas
      let query = supabase
        .from('vendas')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtro de status
      if (filters.status_venda && filters.status_venda !== 'todas') {
        query = query.eq('status_venda', filters.status_venda);
      }

      // Aplicar filtro de responsável para vendedores
      const permFilter = getPermissionFilter();
      if (permFilter?.responsavel_id) {
        query = query.eq('responsavel_id', permFilter.responsavel_id);
      }

      // Aplicar filtro de busca por responsável específico
      if (filters.responsavel_id) {
        query = query.eq('responsavel_id', filters.responsavel_id);
      }

      // Aplicar filtro de data
      if (filters.data_inicio) {
        query = query.gte('created_at', filters.data_inicio);
      }
      if (filters.data_fim) {
        query = query.lte('created_at', filters.data_fim);
      }

      const { data: vendasData, error: vendasError } = await query;

      if (vendasError) throw vendasError;

      // Buscar dados relacionados
      const vendasComDetalhes: VendaComDetalhes[] = [];
      
      for (const venda of vendasData || []) {
        // Buscar cliente
        const { data: clienteData } = await supabase
          .from('users')
          .select('nome, email, telefone')
          .eq('id', venda.client_id)
          .single();

        // Buscar contrato (via pedido_id legado)
        let contratoStatus = null;
        if (venda.pedido_id) {
          const { data: contratoData } = await supabase
            .from('contratos_legais')
            .select('status')
            .eq('pedido_id', venda.pedido_id)
            .single();
          contratoStatus = contratoData?.status;
        }

        // Buscar campanha
        const { data: campanhaData } = await supabase
          .from('campanhas_exa')
          .select('status_operacional, periodo_inicio, periodo_fim')
          .eq('venda_id', venda.id)
          .single();

        // Buscar assinatura
        const { data: assinaturaData } = await supabase
          .from('assinaturas')
          .select('status, tipo')
          .eq('venda_id', venda.id)
          .single();

        const vendaComDetalhes: VendaComDetalhes = {
          id: venda.id,
          client_id: venda.client_id,
          proposta_id: venda.proposta_id,
          pedido_id: venda.pedido_id,
          valor_total: venda.valor_total || 0,
          plano_meses: venda.plano_meses || 1,
          cupom_id: venda.cupom_id,
          status_venda: venda.status_venda as StatusVenda,
          responsavel_id: venda.responsavel_id,
          data_fechamento: venda.data_fechamento,
          created_at: venda.created_at,
          updated_at: venda.updated_at,
          cliente_nome: clienteData?.nome || 'Cliente não encontrado',
          cliente_email: clienteData?.email,
          cliente_telefone: clienteData?.telefone,
          contrato_status: contratoStatus,
          campanha_status: campanhaData?.status_operacional as StatusCampanhaOperacional | undefined,
          campanha_periodo_inicio: campanhaData?.periodo_inicio,
          campanha_periodo_fim: campanhaData?.periodo_fim,
          assinatura_status: assinaturaData?.status as StatusAssinatura | undefined,
          assinatura_tipo: assinaturaData?.tipo as TipoAssinatura | undefined,
        };

        // Aplicar filtro de busca textual
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesSearch = 
            vendaComDetalhes.cliente_nome?.toLowerCase().includes(searchLower) ||
            vendaComDetalhes.cliente_email?.toLowerCase().includes(searchLower) ||
            vendaComDetalhes.id.toLowerCase().includes(searchLower);
          
          if (!matchesSearch) continue;
        }

        vendasComDetalhes.push(vendaComDetalhes);
      }

      setVendas(vendasComDetalhes);

      // Calcular métricas
      const total = vendasComDetalhes.length;
      const em_negociacao = vendasComDetalhes.filter(v => v.status_venda === 'em_negociacao').length;
      const ganhas = vendasComDetalhes.filter(v => v.status_venda === 'ganha').length;
      const perdidas = vendasComDetalhes.filter(v => v.status_venda === 'perdida').length;
      const valor_total_ganhas = vendasComDetalhes
        .filter(v => v.status_venda === 'ganha')
        .reduce((acc, v) => acc + (v.valor_total || 0), 0);
      const taxa_conversao = total > 0 ? (ganhas / total) * 100 : 0;

      setMetrics({
        total,
        em_negociacao,
        ganhas,
        perdidas,
        valor_total_ganhas,
        taxa_conversao,
      });

    } catch (err) {
      console.error('Erro ao buscar vendas:', err);
      setError('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  }, [user, filters, getPermissionFilter]);

  // Atualizar status da venda
  const updateStatusVenda = async (vendaId: string, novoStatus: StatusVenda) => {
    try {
      const updateData: Record<string, unknown> = { status_venda: novoStatus };
      
      if (novoStatus === 'ganha') {
        updateData.data_fechamento = new Date().toISOString();
      }

      const { error } = await supabase
        .from('vendas')
        .update(updateData)
        .eq('id', vendaId);

      if (error) throw error;

      // Recarregar vendas
      await fetchVendas();
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      return { success: false, error: 'Erro ao atualizar status da venda' };
    }
  };

  useEffect(() => {
    fetchVendas();
  }, [fetchVendas]);

  const role = getUserRole();

  return {
    vendas,
    loading,
    error,
    filters,
    setFilters,
    metrics,
    refetch: fetchVendas,
    updateStatusVenda,
    // Permissões
    canEdit: ['admin', 'super_admin', 'gerente'].includes(role),
    canDelete: role === 'super_admin',
  };
};
