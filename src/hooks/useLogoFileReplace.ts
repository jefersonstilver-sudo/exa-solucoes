import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useLogoFileReplace = () => {
  const [uploading, setUploading] = useState(false);

  const replaceLogoFile = async (logoId: string, newFile: File) => {
    if (!logoId || !newFile) return false;

    setUploading(true);

    try {
      // Validações
      if (!newFile.type.includes('png')) {
        toast.error('Apenas arquivos PNG são aceitos');
        return false;
      }

      if (newFile.size > 1024 * 1024) {
        toast.error('Arquivo muito grande (máx. 1MB)');
        return false;
      }

      // Gerar novo nome único para o arquivo
      const sanitizedName = newFile.name
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      const fileName = `logo_${Date.now()}_${sanitizedName}`;
      const storageKey = `PAGINA PRINCIPAL LOGOS/${fileName}`;

      // Upload para o bucket "arquivos" (consistência com bulk upload)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('arquivos')
        .upload(storageKey, newFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        toast.error('Erro no upload do arquivo');
        return false;
      }

      // Obter URL pública do novo arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('arquivos')
        .getPublicUrl(storageKey);

      // Atualizar registro da logo no banco
      const { error: updateError } = await supabase.functions.invoke('logos', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          id: logoId,
          file_url: publicUrl,
          storage_bucket: 'arquivos',
          storage_key: storageKey
        }
      });

      if (updateError) {
        console.error('❌ Database update error:', updateError);
        // Limpar arquivo uploadado em caso de erro
        await supabase.storage.from('arquivos').remove([storageKey]);
        toast.error('Erro ao atualizar logo no banco');
        return false;
      }

      toast.success('Arquivo da logo atualizado com sucesso!');
      return true;

    } catch (error) {
      console.error('❌ Error replacing logo file:', error);
      toast.error('Erro inesperado ao trocar arquivo');
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    replaceLogoFile,
    uploading
  };
};