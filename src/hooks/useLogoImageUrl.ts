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
        // Se tem informações de storage, SEMPRE gerar URL assinada (bucket privado)
        if (logo.storage_bucket && logo.storage_key) {
          // Pular direto para gerar signed URL abaixo
        } else {
          // Sem info de storage: usar file_url diretamente (URL externa)
          const isSignedUrl = logo.file_url.includes('/storage/v1/object/sign/') || logo.file_url.includes('token=');
          
          if (isSignedUrl) {
            setImageUrl(logo.file_url);
          } else {
            const separator = logo.file_url.includes('?') ? '&' : '?';
            const urlWithCacheBuster = `${logo.file_url}${separator}v=${Date.now()}`;
            setImageUrl(urlWithCacheBuster);
          }
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
            // Aplicar cache-busting com separador correto
            const separator = publicData.publicUrl.includes('?') ? '&' : '?';
            const urlWithCacheBuster = `${publicData.publicUrl}${separator}v=${Date.now()}`;
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