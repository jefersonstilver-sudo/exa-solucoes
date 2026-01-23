import { useState } from 'react';
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
}

export const useBusinessSegments = () => {
  const queryClient = useQueryClient();

  // Fetch all active segments
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
      toast.success(`Segmento "${newSegment.label}" criado com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar segmento');
    }
  });

  // Helper to get label from value
  const getLabelByValue = (value: string): string => {
    const segment = segments.find(s => s.value === value);
    return segment?.label || value;
  };

  return {
    segments,
    isLoading,
    createSegment: createSegmentMutation.mutateAsync,
    isCreating: createSegmentMutation.isPending,
    getLabelByValue
  };
};
