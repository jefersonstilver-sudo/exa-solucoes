import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Logo {
  id: string;
  name: string;
  file_url: string;
  color_variant: 'white' | 'dark';
  link_url?: string;
  sort_order: number;
  is_active: boolean;
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

      // Buscar diretamente as logos públicas da tabela com RLS (is_active = true)
      const { data, error } = await supabase
        .from('logos')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching logos:', error);
        setError('Erro ao carregar logos');
        return;
      }

      const rawLogos = data || [];

      // Tentar resolver URL assinada (funciona mesmo se o bucket não for público);
      // se falhar, cai para a URL pública padrão
      const resolveUrl = async (url: string): Promise<string> => {
        try {
          const u = new URL(url);
          const parts = u.pathname.split('/').filter(Boolean);
          const objectIdx = parts.findIndex((p) => p === 'object');
          if (objectIdx === -1) return url;

          const maybePublic = parts[objectIdx + 1]; // 'public' ou bucket
          const bucket = maybePublic === 'public' ? parts[objectIdx + 2] : maybePublic;
          const pathStart = maybePublic === 'public' ? objectIdx + 3 : objectIdx + 2;
          const objectPath = decodeURIComponent(parts.slice(pathStart).join('/'));

          // 1) Tenta URL assinada (para buckets privados)
          const { data: signed, error: signErr } = await supabase.storage
            .from(bucket)
            .createSignedUrl(objectPath, 60 * 60);
          if (!signErr && signed?.signedUrl) return signed.signedUrl;

          // 2) Fallback para URL pública (para buckets públicos)
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectPath);
          return pub.publicUrl || url;
        } catch {
          return url;
        }
      };

      const typedLogos: Logo[] = await Promise.all(
        rawLogos.map(async (logo: any) => ({
          ...logo,
          file_url: await resolveUrl(logo.file_url),
          color_variant: (logo.color_variant as 'white' | 'dark') || 'white',
        }))
      );

      console.log('✅ Logos fetched successfully:', typedLogos.length);
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

      // Buscar todas as logos (incluindo inativas) para admin
      const { data, error } = await supabase
        .from('logos')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching all logos:', error);
        setError('Erro ao carregar logos');
        return;
      }

      console.log('✅ All logos fetched for admin:', data?.length || 0);
      
      // Garantir tipagem correta dos dados do Supabase
      const typedLogos: Logo[] = (data || []).map(logo => ({
        ...logo,
        color_variant: (logo.color_variant as 'white' | 'dark') || 'white'
      }));
      
      setLogos(typedLogos);
    } catch (err) {
      console.error('❌ Unexpected error fetching all logos:', err);
      setError('Erro inesperado ao carregar logos');
    } finally {
      setLoading(false);
    }
  };

  const updateLogo = async (id: string, updates: Partial<Logo>) => {
    try {
      const { data, error } = await supabase.functions.invoke('logos', {
        method: 'PATCH',
        body: updates,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        throw error;
      }

      // Refresh local state
      await fetchAllLogos();
      return data;
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

  // Real-time para admin também
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