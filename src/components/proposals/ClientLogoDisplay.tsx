import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ClientLogoDisplayProps {
  logoUrl: string;
  className?: string;
  containerClassName?: string;
}

/**
 * Componente para exibir logo do cliente em páginas públicas
 * Gera signed URL automaticamente para buckets privados
 */
export const ClientLogoDisplay: React.FC<ClientLogoDisplayProps> = ({
  logoUrl,
  className = '',
  containerClassName = ''
}) => {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const resolveImageUrl = async () => {
      setLoading(true);
      setError(false);
      
      if (!logoUrl) {
        setDisplayUrl(null);
        setLoading(false);
        return;
      }

      try {
        // Verificar se é URL do Supabase Storage e extrair path
        const supabaseStoragePattern = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;
        const match = logoUrl.match(supabaseStoragePattern);

        if (match) {
          const bucketName = match[1];
          const filePath = match[2].split('?')[0]; // Remove query params
          
          console.log('🔐 [LOGO PUBLIC] Gerando signed URL para:', { bucketName, filePath });
          
          // Tentar gerar signed URL (funciona para buckets privados)
          const { data: signedData, error: signedError } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(filePath, 60 * 60 * 2); // 2 horas de validade

          if (signedData?.signedUrl && !signedError) {
            console.log('✅ [LOGO PUBLIC] Signed URL gerada com sucesso');
            setDisplayUrl(signedData.signedUrl);
            setLoading(false);
            return;
          }
          
          console.warn('⚠️ [LOGO PUBLIC] Falha ao gerar signed URL:', signedError?.message);
        }

        // Fallback: usar URL direta com cache-busting
        const separator = logoUrl.includes('?') ? '&' : '?';
        const urlWithCacheBuster = `${logoUrl}${separator}v=${Date.now()}`;
        setDisplayUrl(urlWithCacheBuster);
        
      } catch (err) {
        console.error('❌ [LOGO PUBLIC] Erro ao resolver URL:', err);
        setDisplayUrl(logoUrl);
      } finally {
        setLoading(false);
      }
    };

    resolveImageUrl();
  }, [logoUrl]);

  const handleImageError = () => {
    console.error('❌ [LOGO PUBLIC] Erro ao carregar imagem:', displayUrl);
    setError(true);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${containerClassName}`}>
        <Loader2 className="h-5 w-5 animate-spin text-white/60" />
      </div>
    );
  }

  if (error || !displayUrl) {
    return null; // Esconde se deu erro
  }

  return (
    <img 
      src={displayUrl}
      alt="Logo do cliente"
      className={className}
      onError={handleImageError}
      onLoad={() => console.log('✅ [LOGO PUBLIC] Imagem carregada com sucesso')}
    />
  );
};
