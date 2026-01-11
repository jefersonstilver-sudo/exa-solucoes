/**
 * Hook para gerenciar comprovantes do lançamento
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Comprovante, LancamentoTipo } from '../types';

interface UseComprovantesProps {
  lancamentoId: string | null;
  lancamentoTipo: LancamentoTipo | null;
  onUpdate: () => void;
  logHistorico: (acao: string, campo?: string, antes?: any, depois?: any) => Promise<void>;
}

export const useComprovantes = ({ 
  lancamentoId, 
  lancamentoTipo, 
  onUpdate,
  logHistorico 
}: UseComprovantesProps) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const uploadComprovante = useCallback(async (
    file: File,
    tipoComprovante: Comprovante['tipo_comprovante'],
    observacao?: string
  ) => {
    if (!lancamentoId || !lancamentoTipo) return false;

    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${lancamentoId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('lancamento-comprovantes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('lancamento-comprovantes')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('lancamento_comprovantes')
        .insert({
          lancamento_id: lancamentoId,
          lancamento_tipo: lancamentoTipo,
          tipo_comprovante: tipoComprovante,
          arquivo_url: urlData.publicUrl,
          arquivo_nome: file.name,
          arquivo_tamanho_kb: Math.round(file.size / 1024),
          observacao: observacao || null,
          uploaded_by: userData.user.id
        });

      if (dbError) throw dbError;

      await logHistorico('comprovante_anexado', 'comprovante', null, file.name);
      onUpdate();
      toast.success('Comprovante anexado');
      return true;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao anexar comprovante');
      return false;
    } finally {
      setUploading(false);
    }
  }, [lancamentoId, lancamentoTipo, onUpdate, logHistorico]);

  const deleteComprovante = useCallback(async (comprovante: Comprovante) => {
    if (!comprovante) return false;

    setDeleting(comprovante.id);
    try {
      // Extract file path from URL
      const urlParts = comprovante.arquivo_url.split('/');
      const filePath = urlParts.slice(-2).join('/');

      // Delete from storage
      await supabase.storage
        .from('lancamento-comprovantes')
        .remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('lancamento_comprovantes')
        .delete()
        .eq('id', comprovante.id);

      if (error) throw error;

      await logHistorico('comprovante_removido', 'comprovante', comprovante.arquivo_nome, null);
      onUpdate();
      toast.success('Comprovante removido');
      return true;
    } catch (error) {
      console.error('Erro ao remover:', error);
      toast.error('Erro ao remover comprovante');
      return false;
    } finally {
      setDeleting(null);
    }
  }, [onUpdate, logHistorico]);

  return {
    uploading,
    deleting,
    uploadComprovante,
    deleteComprovante
  };
};
