import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ConversationNote } from '../types/crmTypes';

export const useConversationNotes = (phoneNumber: string, agentKey: string) => {
  const [notes, setNotes] = useState<ConversationNote[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    if (!phoneNumber || !agentKey) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversation_notes')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('agent_key', agentKey)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes((data as any) || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Erro ao carregar notas');
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (noteText: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('conversation_notes').insert({
        phone_number: phoneNumber,
        agent_key: agentKey,
        note_text: noteText,
        created_by: user.id
      });

      if (error) throw error;
      toast.success('Nota adicionada com sucesso');
      await fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Erro ao adicionar nota');
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      toast.success('Nota removida');
      await fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Erro ao remover nota');
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [phoneNumber, agentKey]);

  return { notes, loading, addNote, deleteNote, refetch: fetchNotes };
};
