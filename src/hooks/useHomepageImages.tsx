
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HomepageConfig {
  id: string;
  service_type: string;
  title: string;
  image_url: string;
  button_text: string;
  button_icon: string;
  href: string;
  updated_at: string;
}

export const useHomepageImages = () => {
  const [configs, setConfigs] = useState<HomepageConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_config')
        .select('*')
        .order('service_type');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações da homepage');
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (serviceType: string, updates: Partial<HomepageConfig>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('homepage_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('service_type', serviceType);

      if (error) throw error;

      // Atualizar estado local
      setConfigs(prev => prev.map(config => 
        config.service_type === serviceType 
          ? { ...config, ...updates, updated_at: new Date().toISOString() }
          : config
      ));

      toast.success('Configuração atualizada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao salvar alterações');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const uploadImage = async (file: File, serviceType: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${serviceType}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('homepage-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('homepage-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return {
    configs,
    isLoading,
    isSaving,
    updateConfig,
    uploadImage,
    refetch: fetchConfigs
  };
};
