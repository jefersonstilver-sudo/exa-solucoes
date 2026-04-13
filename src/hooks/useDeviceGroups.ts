import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DeviceGroup {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  created_at: string;
}

export const useDeviceGroups = () => {
  const [groups, setGroups] = useState<DeviceGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('device_groups')
        .select('*')
        .order('ordem', { ascending: true });
      if (error) throw error;
      setGroups(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar device_groups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('device_groups_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'device_groups' }, () => {
        fetchGroups();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchGroups]);

  const createGroup = async (nome: string, cor: string = '#6B7280') => {
    try {
      const maxOrdem = groups.length > 0 ? Math.max(...groups.map(g => g.ordem)) + 1 : 0;
      const { data, error } = await (supabase as any)
        .from('device_groups')
        .insert({ nome, cor, ordem: maxOrdem })
        .select()
        .single();
      if (error) throw error;
      setGroups(prev => [...prev, data as DeviceGroup]);
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
        .from('device_groups')
        .update(updates)
        .eq('id', groupId);
      if (error) throw error;
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g));
      toast.success('Grupo atualizado');
    } catch (err: any) {
      toast.error('Erro ao atualizar grupo', { description: err.message });
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('device_groups')
        .delete()
        .eq('id', groupId);
      if (error) throw error;
      setGroups(prev => prev.filter(g => g.id !== groupId));
      toast.success('Grupo excluído');
    } catch (err: any) {
      toast.error('Erro ao excluir grupo', { description: err.message });
    }
  };

  const moveDeviceToGroup = async (deviceId: string, groupId: string | null) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ device_group_id: groupId } as any)
        .eq('id', deviceId);
      if (error) throw error;
      toast.success('Dispositivo movido');
    } catch (err: any) {
      toast.error('Erro ao mover dispositivo', { description: err.message });
    }
  };

  return {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    moveDeviceToGroup,
    refetchGroups: fetchGroups,
  };
};
