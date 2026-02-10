import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Logo {
  id: string;
  name: string;
  file_url: string;
  color_variant: 'white' | 'dark' | 'colored';
  link_url?: string;
  sort_order: number;
  is_active: boolean;
  storage_bucket?: string;
  storage_key?: string;
  scale_factor?: number;
  created_at: string;
  updated_at: string;
}

export const useLogos = () => {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar a Edge Function para obter logos públicas
      const { data, error } = await supabase.functions.invoke('logos', {
        method: 'GET'
      });

      if (error) {
        console.error('❌ Error fetching logos:', error);
        setError('Erro ao carregar logos');
        return;
      }

      console.log('✅ Logos fetched successfully:', data?.length || 0);
      
      // Garantir tipagem correta dos dados da Edge Function
      const typedLogos: Logo[] = (data || []).map(logo => ({
        ...logo,
        color_variant: (logo.color_variant as 'white' | 'dark' | 'colored') || 'white'
      }));
      
      setLogos(typedLogos);
    } catch (err) {
      console.error('❌ Unexpected error fetching logos:', err);
      setError('Erro inesperado ao carregar logos');
    } finally {
      setLoading(false);
    }
  };

  const refreshLogos = () => {
    fetchLogos();
  };

  // Carregar logos na inicialização
  useEffect(() => {
    fetchLogos();
  }, []);

  // Configurar real-time updates via Supabase
  useEffect(() => {
    console.log('🔄 Setting up real-time subscription for logos');
    
    const channel = supabase
      .channel('logos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logos'
        },
        (payload) => {
          console.log('🔄 Real-time logo change detected:', payload);
          
          // Refresh logos quando houver mudanças
          fetchLogos();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Unsubscribing from logos real-time updates');
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    logos,
    loading,
    error,
    refreshLogos
  };
};

// Hook específico para administradores
export const useLogosAdmin = () => {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllLogos = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ FIX: Select apenas colunas necessárias + LIMIT
      const { data, error } = await supabase
        .from('logos')
        .select('id, name, file_url, color_variant, link_url, sort_order, is_active, storage_bucket, storage_key, scale_factor, created_at, updated_at')
        .order('sort_order', { ascending: true })
        .limit(50); // Limite razoável para admin

      if (error) {
        console.error('❌ Error fetching all logos:', error);
        setError('Erro ao carregar logos');
        return;
      }

      console.log('✅ All logos fetched for admin:', data?.length || 0);
      
      // Garantir tipagem correta dos dados do Supabase
      const typedLogos: Logo[] = (data || []).map(logo => ({
        ...logo,
        color_variant: (logo.color_variant as 'white' | 'dark' | 'colored') || 'white'
      }));
      
      setLogos(typedLogos);
    } catch (err) {
      console.error('❌ Unexpected error fetching all logos:', err);
      setError('Erro inesperado ao carregar logos');
    } finally {
      setLoading(false);
    }
  };

  // Flag to skip next realtime refetch (avoids duplicate after optimistic update)
  const skipNextRealtime = useRef(false);

  const updateLogo = async (id: string, updates: Partial<Logo>) => {
    // 1. Optimistic: update local state immediately
    const previousLogos = logos;
    setLogos(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    skipNextRealtime.current = true;

    try {
      // 2. DB update (no refetch after)
      const { error } = await supabase
        .from('logos')
        .update(updates)
        .eq('id', id);

      if (error) {
        // 3. Rollback on error
        setLogos(previousLogos);
        skipNextRealtime.current = false;
        throw error;
      }
    } catch (err) {
      console.error('❌ Error updating logo:', err);
      throw err;
    }
  };

  const toggleLogoActive = async (id: string, isActive: boolean) => {
    return updateLogo(id, { is_active: isActive });
  };

  const updateSortOrder = async (logoId: string, newSortOrder: number) => {
    return updateLogo(logoId, { sort_order: newSortOrder });
  };

  const bulkUploadLogos = async (logoData: Partial<Logo>[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('logos', {
        method: 'POST',
        body: { logos: logoData }
      });

      if (error) {
        throw error;
      }

      // Refresh após upload
      await fetchAllLogos();
      return data;
    } catch (err) {
      console.error('❌ Error uploading logos:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAllLogos();
  }, []);

  // Real-time para admin também (skip if triggered by own optimistic update)
  useEffect(() => {
    const channel = supabase
      .channel('logos-admin-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logos'
        },
        () => {
          if (skipNextRealtime.current) {
            skipNextRealtime.current = false;
            return;
          }
          fetchAllLogos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    logos,
    loading,
    error,
    refreshLogos: fetchAllLogos,
    updateLogo,
    toggleLogoActive,
    updateSortOrder,
    bulkUploadLogos
  };
};