
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HomepageBanner {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
  link_url?: string;
  order_position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useHomepageBanners = () => {
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_banners')
        .select('*')
        .eq('is_active', true)
        .order('order_position');

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Erro ao buscar banners:', error);
      toast.error('Erro ao carregar banners');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_banners')
        .select('*')
        .order('order_position');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar todos os banners:', error);
      return [];
    }
  };

  const updateBanner = async (id: string, updates: Partial<HomepageBanner>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('homepage_banners')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Banner atualizado com sucesso!');
      await fetchBanners();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar banner:', error);
      toast.error('Erro ao atualizar banner');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const createBanner = async (banner: Omit<HomepageBanner, 'id' | 'created_at' | 'updated_at'>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('homepage_banners')
        .insert([banner]);

      if (error) throw error;
      
      toast.success('Banner criado com sucesso!');
      await fetchBanners();
      return true;
    } catch (error) {
      console.error('Erro ao criar banner:', error);
      toast.error('Erro ao criar banner');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBanner = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('homepage_banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Banner removido com sucesso!');
      await fetchBanners();
      return true;
    } catch (error) {
      console.error('Erro ao remover banner:', error);
      toast.error('Erro ao remover banner');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('homepage-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('homepage-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  return {
    banners,
    isLoading,
    isSaving,
    fetchBanners,
    fetchAllBanners,
    updateBanner,
    createBanner,
    deleteBanner,
    uploadImage,
  };
};
