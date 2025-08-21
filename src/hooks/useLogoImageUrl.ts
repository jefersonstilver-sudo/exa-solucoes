import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLogoImageUrl = (logo: { file_url: string; storage_bucket?: string; storage_key?: string } | null) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!logo) {
      setImageUrl(null);
      return;
    }

    const generateSignedUrl = async () => {
      setLoading(true);
      
      try {
        // Se já é uma URL externa ou não tem informações de storage, usar diretamente
        if (!logo.storage_bucket || !logo.storage_key || logo.file_url.startsWith('http')) {
          const urlWithCacheBuster = `${logo.file_url}?v=${Date.now()}`;
          setImageUrl(urlWithCacheBuster);
          setLoading(false);
          return;
        }

        // Tentar gerar URL assinada
        const { data, error } = await supabase.storage
          .from(logo.storage_bucket)
          .createSignedUrl(logo.storage_key, 60 * 60 * 24); // 24 horas

        if (data?.signedUrl && !error) {
          setImageUrl(data.signedUrl);
        } else {
          // Fallback para URL pública com cache-busting
          const { data: publicData } = supabase.storage
            .from(logo.storage_bucket)
            .getPublicUrl(logo.storage_key);
          
          if (publicData?.publicUrl) {
            const urlWithCacheBuster = `${publicData.publicUrl}?v=${Date.now()}`;
            setImageUrl(urlWithCacheBuster);
          } else {
            setImageUrl(logo.file_url);
          }
        }
      } catch (error) {
        console.warn('Error generating signed URL for logo:', error);
        // Fallback para URL original
        setImageUrl(logo.file_url);
      } finally {
        setLoading(false);
      }
    };

    generateSignedUrl();
  }, [logo?.file_url, logo?.storage_bucket, logo?.storage_key]);

  return { imageUrl, loading };
};