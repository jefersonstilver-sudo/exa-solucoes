import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EventType {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
  is_default: boolean;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export const useEventTypes = () => {
  const queryClient = useQueryClient();

  const { data: eventTypes = [], isLoading } = useQuery({
    queryKey: ['event-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as EventType[];
    },
    staleTime: 1000 * 60 * 5, // 5min cache
  });

  const activeEventTypes = eventTypes.filter(et => et.active);

  const createMutation = useMutation({
    mutationFn: async ({ name, label, icon, color }: { name: string; label: string; icon: string; color: string }) => {
      const maxOrder = eventTypes.reduce((max, et) => Math.max(max, et.sort_order), 0);
      const { error } = await supabase
        .from('event_types')
        .insert({ name, label, icon, color, sort_order: maxOrder + 1 } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tipo de evento criado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['event-types'] });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Já existe um tipo com este nome interno');
      } else {
        toast.error(`Erro ao criar tipo: ${error.message}`);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, label, icon, color }: { id: string; label: string; icon: string; color: string }) => {
      const { error } = await supabase
        .from('event_types')
        .update({ label, icon, color } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tipo de evento atualizado');
      queryClient.invalidateQueries({ queryKey: ['event-types'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('event_types')
        .delete()
        .eq('id', id)
        .eq('is_default', false);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tipo de evento removido');
      queryClient.invalidateQueries({ queryKey: ['event-types'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('event_types')
        .update({ active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-types'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from('event_types')
        .update({ sort_order: newOrder } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-types'] });
    },
  });

  const swapOrder = async (indexA: number, indexB: number) => {
    const a = eventTypes[indexA];
    const b = eventTypes[indexB];
    if (!a || !b) return;
    await Promise.all([
      supabase.from('event_types').update({ sort_order: b.sort_order } as any).eq('id', a.id),
      supabase.from('event_types').update({ sort_order: a.sort_order } as any).eq('id', b.id),
    ]);
    queryClient.invalidateQueries({ queryKey: ['event-types'] });
  };

  const getEventTypeConfig = (name: string) => {
    const found = eventTypes.find(et => et.name === name);
    if (found) return { icon: found.icon, color: found.color, label: found.label };
    return { icon: '📋', color: 'bg-gray-100 text-gray-700', label: name || 'Evento' };
  };

  return {
    eventTypes,
    activeEventTypes,
    isLoading,
    createEventType: createMutation.mutate,
    updateEventType: updateMutation.mutate,
    deleteEventType: deleteMutation.mutate,
    toggleEventType: toggleMutation.mutate,
    reorderEventType: reorderMutation.mutate,
    swapOrder,
    getEventTypeConfig,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
