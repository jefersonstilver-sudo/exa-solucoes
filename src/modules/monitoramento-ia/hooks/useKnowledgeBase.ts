import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KnowledgeDocument {
  id: string;
  agent_key: string | null;
  file_name: string;
  mime_type: string;
  size: number;
  status: 'indexing' | 'ready' | 'error';
  storage_path: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useKnowledgeBase = (agentKey?: string) => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const listDocuments = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('knowledge_base').select('*');
      
      if (agentKey) {
        query = query.eq('agent_key', agentKey);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      setDocuments((data || []) as KnowledgeDocument[]);
    } catch (err: any) {
      toast.error('Erro ao listar documentos');
      console.error('[useKnowledgeBase] List error:', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File, targetAgentKey: string) => {
    try {
      setUploading(true);
      
      // Upload para bucket 'knowledge'
      const filePath = `${targetAgentKey}/${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      
      // Inserir em knowledge_base
      const { error: insertError } = await supabase
        .from('knowledge_base')
        .insert({
          agent_key: targetAgentKey,
          file_name: file.name,
          mime_type: file.type,
          size: file.size,
          storage_path: uploadData.path,
          status: 'indexing'
        });

      if (insertError) throw insertError;
      
      await listDocuments();
      toast.success('Documento enviado com sucesso');
    } catch (err: any) {
      toast.error('Erro ao enviar documento');
      console.error('[useKnowledgeBase] Upload error:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId: string, storagePath: string) => {
    try {
      // Remover do storage
      const { error: storageError } = await supabase.storage
        .from('knowledge')
        .remove([storagePath]);

      if (storageError) console.warn('Storage delete warning:', storageError);
      
      // Remover do DB
      const { error: dbError } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;
      
      await listDocuments();
      toast.success('Documento removido');
    } catch (err: any) {
      toast.error('Erro ao remover documento');
      console.error('[useKnowledgeBase] Delete error:', err);
    }
  };

  const reprocessDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ status: 'indexing' })
        .eq('id', documentId);

      if (error) throw error;
      
      await listDocuments();
      toast.success('Documento em reprocessamento');
    } catch (err: any) {
      toast.error('Erro ao reprocessar documento');
      console.error('[useKnowledgeBase] Reprocess error:', err);
    }
  };

  useEffect(() => {
    listDocuments();
  }, [agentKey]);

  return {
    documents,
    loading,
    uploading,
    listDocuments,
    uploadDocument,
    deleteDocument,
    reprocessDocument
  };
};
