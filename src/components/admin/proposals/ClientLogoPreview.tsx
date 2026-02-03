import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2, AlertCircle, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ClientLogoPreviewProps {
  logoUrl: string;
  onReplace: () => void;
  onRemove: () => void;
}

/**
 * Componente que exibe preview do logo do cliente com suporte a:
 * - Buckets privados (via signed URL)
 * - URLs públicas
 * - Fallback de erro
 */
export const ClientLogoPreview: React.FC<ClientLogoPreviewProps> = ({
  logoUrl,
  onReplace,
  onRemove
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
          
          console.log('🔐 [LOGO] Gerando signed URL para:', { bucketName, filePath });
          
          // Tentar gerar signed URL (funciona para buckets privados)
          const { data: signedData, error: signedError } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(filePath, 60 * 60); // 1 hora de validade

          if (signedData?.signedUrl && !signedError) {
            console.log('✅ [LOGO] Signed URL gerada com sucesso');
            setDisplayUrl(signedData.signedUrl);
            setLoading(false);
            return;
          }
          
          console.warn('⚠️ [LOGO] Falha ao gerar signed URL:', signedError?.message);
        }

        // Fallback: usar URL direta com cache-busting
        const separator = logoUrl.includes('?') ? '&' : '?';
        const urlWithCacheBuster = `${logoUrl}${separator}v=${Date.now()}`;
        setDisplayUrl(urlWithCacheBuster);
        
      } catch (err) {
        console.error('❌ [LOGO] Erro ao resolver URL:', err);
        setDisplayUrl(logoUrl);
      } finally {
        setLoading(false);
      }
    };

    resolveImageUrl();
  }, [logoUrl]);

  const handleImageError = () => {
    console.error('❌ [LOGO] Erro ao carregar imagem:', displayUrl);
    setError(true);
  };

  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="w-16 h-16 rounded-lg border-2 border-slate-200 overflow-hidden bg-slate-800 flex items-center justify-center">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        ) : error || !displayUrl ? (
          <div className="text-center p-1">
            <AlertCircle className="h-5 w-5 text-amber-400 mx-auto mb-0.5" />
            <span className="text-[10px] text-slate-400">Erro</span>
          </div>
        ) : (
          <img 
            src={displayUrl}
            alt="Logo do cliente" 
            className="w-full h-full object-contain p-1 filter brightness-0 invert"
            onError={handleImageError}
            onLoad={() => console.log('✅ [LOGO] Imagem carregada com sucesso')}
          />
        )}
      </div>
      
      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={onReplace}
        >
          Trocar
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
