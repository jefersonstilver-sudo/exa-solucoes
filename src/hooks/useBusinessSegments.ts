import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BusinessSegment {
  id: string;
  value: string;
  label: string;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  created_by?: string | null;
}

export const useBusinessSegments = () => {
  const queryClient = useQueryClient();

  // Fetch all active segments (for selectors)
  const { data: segments = [], isLoading } = useQuery({
    queryKey: ['business-segments'],
    queryFn: async (): Promise<BusinessSegment[]> => {
      const { data, error } = await supabase
        .from('business_segments')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[useBusinessSegments] Error:', error);
        throw error;
      }

      return data as BusinessSegment[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch ALL segments including inactive (for management)
  const { data: allSegments = [], isLoading: isLoadingAll, refetch: refetchAll } = useQuery({
    queryKey: ['business-segments-all'],
    queryFn: async (): Promise<BusinessSegment[]> => {
      const { data, error } = await supabase
        .from('business_segments')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('label', { ascending: true });

      if (error) {
        console.error('[useBusinessSegments] Error fetching all:', error);
        throw error;
      }

      return data as BusinessSegment[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Create a new segment
  const createSegmentMutation = useMutation({
    mutationFn: async ({ label, category = 'outros' }: { label: string; category?: string }) => {
      // Generate value from label (slug)
      const value = label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, '_') // Replace spaces with underscore
        .substring(0, 50);

      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('business_segments')
        .insert({
          value,
          label: label.trim(),
          category,
          sort_order: 1000, // New segments go to end
          created_by: user?.user?.id
        })
        .select()
        .single();

      if (error) {
        // Check for duplicate
        if (error.code === '23505') {
          throw new Error('Este segmento já existe');
        }
        throw error;
      }

      return data as BusinessSegment;
    },
    onSuccess: (newSegment) => {
      queryClient.invalidateQueries({ queryKey: ['business-segments'] });
      queryClient.invalidateQueries({ queryKey: ['business-segments-all'] });
      toast.success(`Segmento "${newSegment.label}" criado com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar segmento');
    }
  });

  // Update segment (label and/or category)
  const updateSegmentMutation = useMutation({
    mutationFn: async ({ id, label, category }: { id: string; label?: string; category?: string }) => {
      const updates: Partial<BusinessSegment> = {};
      if (label !== undefined) updates.label = label.trim();
      if (category !== undefined) updates.category = category;

      const { data, error } = await supabase
        .from('business_segments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe um segmento com este nome');
        }
        throw error;
      }

      return data as BusinessSegment;
    },
    onSuccess: (updatedSegment) => {
      queryClient.invalidateQueries({ queryKey: ['business-segments'] });
      queryClient.invalidateQueries({ queryKey: ['business-segments-all'] });
      toast.success(`Segmento "${updatedSegment.label}" atualizado!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar segmento');
    }
  });

  // Toggle segment active status
  const toggleSegmentMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('business_segments')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BusinessSegment;
    },
    onSuccess: (segment) => {
      queryClient.invalidateQueries({ queryKey: ['business-segments'] });
      queryClient.invalidateQueries({ queryKey: ['business-segments-all'] });
      toast.success(segment.is_active 
        ? `Segmento "${segment.label}" ativado!` 
        : `Segmento "${segment.label}" desativado!`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao alterar status do segmento');
    }
  });

  // Helper to get label from value
  const getLabelByValue = (value: string): string => {
    const segment = segments.find(s => s.value === value);
    return segment?.label || value;
  };

  // Get unique categories from all segments
  const categories = [...new Set(allSegments.map(s => s.category))].sort();

  return {
    // Active segments (for selectors)
    segments,
    isLoading,
    
    // All segments (for management)
    allSegments,
    isLoadingAll,
    refetchAll,
    categories,
    
    // Mutations
    createSegment: createSegmentMutation.mutateAsync,
    isCreating: createSegmentMutation.isPending,
    
    updateSegment: updateSegmentMutation.mutateAsync,
    isUpdating: updateSegmentMutation.isPending,
    
    toggleSegment: toggleSegmentMutation.mutateAsync,
    isToggling: toggleSegmentMutation.isPending,
    
    // Helpers
    getLabelByValue
  };
};
