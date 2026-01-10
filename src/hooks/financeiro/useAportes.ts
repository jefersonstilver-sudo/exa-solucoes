/**
 * useAportes - Hook para histórico de aportes de sócios
 * 
 * READ-ONLY para tabela aportes_socios (INSERT-only, imutável)
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface AporteSocio {
  id: string;
  socio_id?: string;
  valor: number;
  data: string;
  tipo: 'capital' | 'emprestimo' | 'reinvestimento';
  motivo: string;
  descricao: string;
  comprovante_url?: string;
  created_by?: string;
  created_at: string;
  // Campos expandidos
  socio_nome?: string;
  created_by_nome?: string;
}

export interface NovoAporte {
  socio_id?: string;
  valor: number;
  data: string;
  tipo: 'capital' | 'emprestimo' | 'reinvestimento';
  motivo: string;
  descricao: string;
  comprovante_url?: string;
}

export const useAportes = () => {
  const [aportes, setAportes] = useState<AporteSocio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAportes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('aportes_socios')
        .select(`
          *,
          socio:users!aportes_socios_socio_id_fkey(nome),
          criador:users!aportes_socios_created_by_fkey(nome)
        `)
        .order('data', { ascending: false });

      if (fetchError) throw fetchError;

      const aportesFormatados: AporteSocio[] = (data || []).map((a: any) => ({
        id: a.id,
        socio_id: a.socio_id,
        valor: a.valor,
        data: a.data,
        tipo: a.tipo,
        motivo: a.motivo,
        descricao: a.descricao,
        comprovante_url: a.comprovante_url,
        created_by: a.created_by,
        created_at: a.created_at,
        socio_nome: a.socio?.nome,
        created_by_nome: a.criador?.nome
      }));

      setAportes(aportesFormatados);
    } catch (err: any) {
      console.error('❌ [useAportes] Erro:', err);
      setError(err.message);
      toast.error('Erro ao carregar aportes');
    } finally {
      setLoading(false);
    }
  }, []);

  // INSERT ONLY - Aportes são imutáveis
  const registrarAporte = useCallback(async (aporte: NovoAporte) => {
    try {
      const { data, error: insertError } = await supabase
        .from('aportes_socios')
        .insert({
          ...aporte
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Recarregar para pegar dados expandidos
      await fetchAportes();

      toast.success('Aporte registrado com sucesso');
      return data;
    } catch (err: any) {
      console.error('❌ [useAportes] Erro ao registrar:', err);
      toast.error('Erro ao registrar aporte');
      return null;
    }
  }, [user?.id, fetchAportes]);

  // Totais
  const totais = {
    total: aportes.reduce((acc, a) => acc + a.valor, 0),
    entradas: aportes.filter(a => a.tipo === 'capital' || a.tipo === 'reinvestimento').reduce((acc, a) => acc + a.valor, 0),
    saidas: aportes.filter(a => a.tipo === 'saida').reduce((acc, a) => acc + a.valor, 0)
  };

  // Agrupado por sócio
  const porSocio = aportes.reduce((acc, a) => {
    const key = a.socio_nome || 'Não identificado';
    if (!acc[key]) acc[key] = { entradas: 0, saidas: 0 };
    if (a.tipo === 'entrada') {
      acc[key].entradas += a.valor;
    } else {
      acc[key].saidas += a.valor;
    }
    return acc;
  }, {} as Record<string, { entradas: number; saidas: number }>);

  return {
    aportes,
    loading,
    error,
    totais,
    porSocio,
    fetchAportes,
    registrarAporte
  };
};
