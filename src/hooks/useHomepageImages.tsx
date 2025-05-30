
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
      // Validar arquivo
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não suportado. Use JPG, PNG, WebP ou GIF.');
        return null;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${serviceType}-${Date.now()}.${fileExt}`;

      console.log('Fazendo upload do arquivo:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('homepage-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('Upload bem-sucedido:', uploadData);

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('homepage-images')
        .getPublicUrl(fileName);

      console.log('URL pública:', urlData.publicUrl);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem. Verifique se você tem permissão.');
      return null;
    }
  };

  const deleteImage = async (imageUrl: string) => {
    try {
      // Extrair nome do arquivo da URL
      const fileName = imageUrl.split('/').pop();
      if (!fileName) return false;

      const { error } = await supabase.storage
        .from('homepage-images')
        .remove([fileName]);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      return false;
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
    deleteImage,
    refetch: fetchConfigs
  };
};
