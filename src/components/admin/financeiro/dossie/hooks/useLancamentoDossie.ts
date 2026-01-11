/**
 * Hook principal do Dossiê Financeiro
 * Gerencia estado e operações do lançamento
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  LancamentoDossie, 
  Comprovante, 
  Observacao, 
  AudioRecord, 
  HistoricoEntry,
  Categoria,
  CentroCusto,
  Funcionario,
  LancamentoTipo
} from '../types';

interface UseLancamentoDossieProps {
  lancamentoId: string | null;
  lancamentoTipo: LancamentoTipo | null;
}

export const useLancamentoDossie = ({ lancamentoId, lancamentoTipo }: UseLancamentoDossieProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data
  const [comprovantes, setComprovantes] = useState<Comprovante[]>([]);
  const [observacoes, setObservacoes] = useState<Observacao[]>([]);
  const [audios, setAudios] = useState<AudioRecord[]>([]);
  const [historico, setHistorico] = useState<HistoricoEntry[]>([]);
  
  // Lookup data
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  // Fetch all supporting data
  const fetchSupportingData = useCallback(async () => {
    if (!lancamentoId || !lancamentoTipo) return;

    setLoading(true);
    try {
      const [
        { data: compData },
        { data: obsData },
        { data: audioData },
        { data: histData },
        { data: catData },
        { data: ccData },
        { data: funcData }
      ] = await Promise.all([
        // Comprovantes
        supabase
          .from('lancamento_comprovantes')
          .select('*')
          .eq('lancamento_id', lancamentoId)
          .eq('lancamento_tipo', lancamentoTipo)
          .order('created_at', { ascending: false }),
        
        // Observações
        supabase
          .from('lancamento_observacoes')
          .select('*')
          .eq('lancamento_id', lancamentoId)
          .eq('lancamento_tipo', lancamentoTipo)
          .order('created_at', { ascending: false }),
        
        // Áudios
        supabase
          .from('lancamento_audios')
          .select('*')
          .eq('lancamento_id', lancamentoId)
          .eq('lancamento_tipo', lancamentoTipo)
          .order('created_at', { ascending: false }),
        
        // Histórico
        supabase
          .from('lancamento_historico')
          .select('*')
          .eq('lancamento_id', lancamentoId)
          .eq('lancamento_tipo', lancamentoTipo)
          .order('created_at', { ascending: false }),
        
        // Categorias (hierárquicas)
        supabase
          .from('categorias_despesas')
          .select('id, nome, tipo, fluxo, parent_id')
          .eq('ativo', true)
          .order('nome'),
        
        // Centros de Custo
        supabase
          .from('centros_custo')
          .select('id, nome, codigo')
          .eq('ativo', true)
          .order('nome'),
        
        // Funcionários (join with users for name)
        supabase
          .from('funcionarios')
          .select('id, cargo, user_id, users!inner(nome)')
          .eq('ativo', true)
      ]);

      setComprovantes((compData || []) as Comprovante[]);
      setObservacoes((obsData || []) as Observacao[]);
      setAudios((audioData || []) as AudioRecord[]);
      setHistorico((histData || []) as HistoricoEntry[]);
      setCategorias((catData || []) as Categoria[]);
      setCentrosCusto(ccData || []);
      setFuncionarios((funcData || []).map((f: any) => ({ 
        id: f.id, 
        nome: f.users?.nome || '', 
        cargo: f.cargo 
      })));
    } catch (error) {
      console.error('Erro ao carregar dados do dossiê:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [lancamentoId, lancamentoTipo]);

  useEffect(() => {
    if (lancamentoId && lancamentoTipo) {
      fetchSupportingData();
    }
  }, [lancamentoId, lancamentoTipo, fetchSupportingData]);

  // Log history entry
  const logHistorico = useCallback(async (
    acao: string,
    campoAlterado?: string,
    valorAnterior?: any,
    valorNovo?: any
  ) => {
    if (!lancamentoId || !lancamentoTipo) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('users')
        .select('nome')
        .eq('id', userData.user?.id)
        .maybeSingle();

      await supabase.from('lancamento_historico').insert({
        lancamento_id: lancamentoId,
        lancamento_tipo: lancamentoTipo,
        acao,
        campo_alterado: campoAlterado,
        valor_anterior: valorAnterior ? JSON.stringify(valorAnterior) : null,
        valor_novo: valorNovo ? JSON.stringify(valorNovo) : null,
        usuario_id: userData.user?.id,
        usuario_nome: userProfile?.nome || 'Sistema'
      });
    } catch (error) {
      console.error('Erro ao registrar histórico:', error);
    }
  }, [lancamentoId, lancamentoTipo]);

  // Update metadata
  const updateMetadata = useCallback(async (
    updates: Partial<LancamentoDossie>,
    currentData: LancamentoDossie
  ) => {
    if (!lancamentoId || !lancamentoTipo) return false;

    setSaving(true);
    try {
      // Build update object based on available fields
      const updateObj: any = {};
      
      if (updates.categoria_id !== undefined) {
        updateObj.categoria_id = updates.categoria_id || null;
        await logHistorico('categoria_alterada', 'categoria_id', currentData.categoria_id, updates.categoria_id);
      }
      
      if (updates.conciliado !== undefined) {
        updateObj.conciliado = updates.conciliado;
        updateObj.conciliado_at = updates.conciliado ? new Date().toISOString() : null;
        await logHistorico(updates.conciliado ? 'conciliado' : 'reconciliado', 'conciliado', currentData.conciliado, updates.conciliado);
      }
      
      if (updates.centro_custo_id !== undefined) {
        updateObj.centro_custo_id = updates.centro_custo_id || null;
        await logHistorico('centro_custo_alterado', 'centro_custo_id', currentData.centro_custo_id, updates.centro_custo_id);
      }
      
      if (updates.tags !== undefined) {
        updateObj.tags = updates.tags && updates.tags.length > 0 ? updates.tags : null;
        await logHistorico('tags_alteradas', 'tags', currentData.tags, updates.tags);
      }
      
      if (updates.observacao !== undefined) {
        updateObj.observacao = updates.observacao || null;
      }
      
      if (updates.tipo_receita !== undefined && lancamentoTipo === 'asaas') {
        updateObj.tipo_receita = updates.tipo_receita || null;
        await logHistorico('tipo_receita_alterado', 'tipo_receita', currentData.tipo_receita, updates.tipo_receita);
      }
      
      if (updates.recorrente !== undefined && lancamentoTipo === 'asaas') {
        updateObj.recorrente = updates.recorrente;
        await logHistorico('recorrencia_alterada', 'recorrente', currentData.recorrente, updates.recorrente);
      }

      if (Object.keys(updateObj).length > 0) {
        if (lancamentoTipo === 'asaas') {
          await supabase
            .from('transacoes_asaas')
            .update(updateObj)
            .eq('payment_id', lancamentoId);
        } else if (lancamentoTipo === 'asaas_saida') {
          await supabase
            .from('asaas_saidas')
            .update(updateObj)
            .eq('asaas_id', lancamentoId);
        } else {
          await supabase
            .from('parcelas_despesas')
            .update(updateObj)
            .eq('id', lancamentoId);
        }
      }

      toast.success('Alterações salvas');
      return true;
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações');
      return false;
    } finally {
      setSaving(false);
    }
  }, [lancamentoId, lancamentoTipo, logHistorico]);

  // Add observation
  const addObservacao = useCallback(async (conteudo: string) => {
    if (!lancamentoId || !lancamentoTipo || !conteudo.trim()) return false;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('users')
        .select('nome')
        .eq('id', userData.user?.id)
        .maybeSingle();

      const { error } = await supabase.from('lancamento_observacoes').insert({
        lancamento_id: lancamentoId,
        lancamento_tipo: lancamentoTipo,
        conteudo: conteudo.trim(),
        autor_id: userData.user?.id,
        autor_nome: userProfile?.nome || 'Usuário'
      });

      if (error) throw error;

      await logHistorico('observacao_adicionada');
      await fetchSupportingData();
      toast.success('Observação adicionada');
      return true;
    } catch (error) {
      console.error('Erro ao adicionar observação:', error);
      toast.error('Erro ao adicionar observação');
      return false;
    }
  }, [lancamentoId, lancamentoTipo, logHistorico, fetchSupportingData]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchSupportingData();
  }, [fetchSupportingData]);

  return {
    loading,
    saving,
    comprovantes,
    observacoes,
    audios,
    historico,
    categorias,
    centrosCusto,
    funcionarios,
    updateMetadata,
    addObservacao,
    logHistorico,
    refresh
  };
};
