import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ConversationTag, ConversationTagAssignment } from '../types/crmTypes';

export const useConversationTags = (phoneNumber?: string, agentKey?: string) => {
  const [availableTags, setAvailableTags] = useState<ConversationTag[]>([]);
  const [assignedTags, setAssignedTags] = useState<ConversationTag[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailableTags = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchAssignedTags = async () => {
    if (!phoneNumber || !agentKey) return;

    try {
      const { data, error } = await supabase
        .from('conversation_tag_assignments')
        .select('*, conversation_tags(*)')
        .eq('phone_number', phoneNumber)
        .eq('agent_key', agentKey);

      if (error) throw error;
      
      const tags = data?.map(d => d.conversation_tags).filter(Boolean) as ConversationTag[];
      setAssignedTags(tags);
    } catch (error) {
      console.error('Error fetching assigned tags:', error);
    }
  };

  const createTag = async (name: string, color: string) => {
    try {
      const { error } = await supabase
        .from('conversation_tags')
        .insert({ name, color });

      if (error) throw error;
      toast.success('Tag criada com sucesso');
      await fetchAvailableTags();
    } catch (error: any) {
      console.error('Error creating tag:', error);
      if (error?.code === '23505') {
        toast.error('Já existe uma tag com esse nome');
      } else {
        toast.error('Erro ao criar tag');
      }
    }
  };

  const assignTag = async (tagId: string) => {
    if (!phoneNumber || !agentKey) return;

    try {
      const { error } = await supabase
        .from('conversation_tag_assignments')
        .insert({
          phone_number: phoneNumber,
          agent_key: agentKey,
          tag_id: tagId
        });

      if (error) throw error;
      toast.success('Tag atribuída');
      await fetchAssignedTags();
    } catch (error: any) {
      if (error?.code === '23505') {
        toast.error('Tag já atribuída a esta conversa');
      } else {
        toast.error('Erro ao atribuir tag');
      }
    }
  };

  const removeTag = async (tagId: string) => {
    if (!phoneNumber || !agentKey) return;

    try {
      const { error } = await supabase
        .from('conversation_tag_assignments')
        .delete()
        .eq('phone_number', phoneNumber)
        .eq('agent_key', agentKey)
        .eq('tag_id', tagId);

      if (error) throw error;
      toast.success('Tag removida');
      await fetchAssignedTags();
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Erro ao remover tag');
    }
  };

  useEffect(() => {
    fetchAvailableTags();
    fetchAssignedTags();
  }, [phoneNumber, agentKey]);

  return {
    availableTags,
    assignedTags,
    loading,
    createTag,
    assignTag,
    removeTag,
    refetch: () => {
      fetchAvailableTags();
      fetchAssignedTags();
    }
  };
};
