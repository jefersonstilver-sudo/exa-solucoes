import { supabase } from '@/integrations/supabase/client';

/**
 * Gera uma signed URL para um objeto em bucket privado.
 * Aceita tanto path puro quanto URL completa (extrai o path automaticamente).
 */
export async function getSignedUrl(
  bucket: string,
  pathOrUrl: string,
  expiresIn = 3600
): Promise<string> {
  if (!pathOrUrl) return '';

  let path = pathOrUrl;

  // Se vier como URL completa, extrai o path após /{bucket}/
  if (pathOrUrl.startsWith('http')) {
    const marker = `/${bucket}/`;
    const idx = pathOrUrl.indexOf(marker);
    if (idx >= 0) {
      path = pathOrUrl.substring(idx + marker.length).split('?')[0];
    }
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error(`[storageSignedUrl] erro ${bucket}/${path}:`, error);
    return '';
  }

  return data?.signedUrl ?? '';
}
