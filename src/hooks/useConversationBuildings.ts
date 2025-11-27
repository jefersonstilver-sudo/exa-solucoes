import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ConversationBuilding {
  id: string;
  conversation_id: string;
  building_id: string;
  is_primary: boolean;
  created_at: string;
  building?: {
    id: string;
    nome: string;
    endereco: string;
    bairro: string;
  };
}

export const useConversationBuildings = (conversationId: string) => {
  const [buildings, setBuildings] = useState<ConversationBuilding[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversation_buildings')
        .select(`
          *,
          building:buildings (
            id,
            nome,
            endereco,
            bairro
          )
        `)
        .eq('conversation_id', conversationId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setBuildings(data || []);
    } catch (error) {
      console.error('Error fetching conversation buildings:', error);
      toast.error('Erro ao carregar prédios do contato');
    } finally {
      setLoading(false);
    }
  };

  const addBuilding = async (buildingId: string, isPrimary: boolean = false) => {
    try {
      // Se estiver marcando como primário, desmarcar outros
      if (isPrimary) {
        await supabase
          .from('conversation_buildings')
          .update({ is_primary: false })
          .eq('conversation_id', conversationId);
      }

      const { error } = await supabase
        .from('conversation_buildings')
        .insert({
          conversation_id: conversationId,
          building_id: buildingId,
          is_primary: isPrimary
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Este prédio já está vinculado ao contato');
          return false;
        }
        throw error;
      }

      await fetchBuildings();
      toast.success('Prédio vinculado com sucesso');
      return true;
    } catch (error) {
      console.error('Error adding building:', error);
      toast.error('Erro ao vincular prédio');
      return false;
    }
  };

  const removeBuilding = async (buildingId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_buildings')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('building_id', buildingId);

      if (error) throw error;

      await fetchBuildings();
      toast.success('Prédio removido');
      return true;
    } catch (error) {
      console.error('Error removing building:', error);
      toast.error('Erro ao remover prédio');
      return false;
    }
  };

  const setPrimaryBuilding = async (buildingId: string) => {
    try {
      // Desmarcar todos como primário
      await supabase
        .from('conversation_buildings')
        .update({ is_primary: false })
        .eq('conversation_id', conversationId);

      // Marcar o selecionado como primário
      const { error } = await supabase
        .from('conversation_buildings')
        .update({ is_primary: true })
        .eq('conversation_id', conversationId)
        .eq('building_id', buildingId);

      if (error) throw error;

      await fetchBuildings();
      toast.success('Prédio principal atualizado');
      return true;
    } catch (error) {
      console.error('Error setting primary building:', error);
      toast.error('Erro ao definir prédio principal');
      return false;
    }
  };

  useEffect(() => {
    if (conversationId) {
      fetchBuildings();
    }
  }, [conversationId]);

  return {
    buildings,
    loading,
    addBuilding,
    removeBuilding,
    setPrimaryBuilding,
    refetch: fetchBuildings
  };
};
