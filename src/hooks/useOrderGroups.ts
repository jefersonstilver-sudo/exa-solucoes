import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrderGroup {
  id: string;
  nome: string;
  user_id: string;
  cor: string;
  ordem: number;
  created_at: string;
}

export const useOrderGroups = (userId?: string) => {
  const [groups, setGroups] = useState<OrderGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('pedido_grupos')
        .select('*')
        .order('ordem', { ascending: true });
      if (error) throw error;
      setGroups(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar grupos:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('pedido_grupos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedido_grupos' }, () => {
        fetchGroups();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchGroups]);

  const createGroup = async (nome: string, cor: string = '#6B7280') => {
    if (!userId) return null;
    try {
      const maxOrdem = groups.length > 0 ? Math.max(...groups.map(g => g.ordem)) + 1 : 0;
      const { data, error } = await (supabase as any)
        .from('pedido_grupos')
        .insert({ nome, cor, user_id: userId, ordem: maxOrdem })
        .select()
        .single();
      if (error) throw error;
      toast.success('Grupo criado com sucesso');
      return data;
    } catch (err: any) {
      toast.error('Erro ao criar grupo', { description: err.message });
      return null;
    }
  };

  const updateGroup = async (groupId: string, updates: { nome?: string; cor?: string }) => {
    try {
      const { error } = await (supabase as any)
        .from('pedido_grupos')
        .update(updates)
        .eq('id', groupId);
      if (error) throw error;
      toast.success('Grupo atualizado');
    } catch (err: any) {
      toast.error('Erro ao atualizar grupo', { description: err.message });
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('pedido_grupos')
        .delete()
        .eq('id', groupId);
      if (error) throw error;
      toast.success('Grupo excluído');
    } catch (err: any) {
      toast.error('Erro ao excluir grupo', { description: err.message });
    }
  };

  const moveOrderToGroup = async (orderId: string, groupId: string | null) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ grupo_id: groupId } as any)
        .eq('id', orderId);
      if (error) throw error;
    } catch (err: any) {
      toast.error('Erro ao mover pedido', { description: err.message });
    }
  };

  return {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    moveOrderToGroup,
    refetchGroups: fetchGroups,
  };
};
