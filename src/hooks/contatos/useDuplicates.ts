import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Contact } from '@/types/contatos';

export const useDuplicates = (currentContactId: string, duplicateGroupId?: string | null) => {
  const [duplicates, setDuplicates] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDuplicates = useCallback(async () => {
    if (!duplicateGroupId) {
      setDuplicates([]);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('duplicate_group_id', duplicateGroupId)
        .neq('id', currentContactId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setDuplicates((data as Contact[]) || []);
    } catch (error) {
      console.error('Erro ao buscar duplicados:', error);
      setDuplicates([]);
    } finally {
      setLoading(false);
    }
  }, [currentContactId, duplicateGroupId]);

  useEffect(() => {
    fetchDuplicates();
  }, [fetchDuplicates]);

  return {
    duplicates,
    loading,
    refetch: fetchDuplicates,
    hasDuplicates: duplicates.length > 0
  };
};
