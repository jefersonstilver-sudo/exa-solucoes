import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useOrderBuildingsManagement = () => {
  const [loading, setLoading] = useState(false);

  const addBuildings = async (orderId: string, buildingIds: string[]) => {
    setLoading(true);
    try {
      // Get current lista_predios
      const { data: order, error: fetchError } = await supabase
        .from('pedidos')
        .select('lista_predios')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      const currentList: string[] = order?.lista_predios || [];
      const newList = [...new Set([...currentList, ...buildingIds])];

      // Update lista_predios in database
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ lista_predios: newList })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Sync with AWS API
      const { data, error: syncError } = await supabase.functions.invoke('sync-buildings-external-api', {
        body: { pedido_id: orderId, action: 'add', building_ids: buildingIds }
      });

      if (syncError) {
        console.error('⚠️ [BUILDINGS] Erro ao sincronizar com AWS:', syncError);
        toast.error('Prédios adicionados no banco, mas houve erro na sincronização AWS.');
      } else if (!data?.success) {
        console.error('⚠️ [BUILDINGS] AWS retornou erro:', data);
        toast.error('Prédios salvos, mas sincronização AWS parcial.');
      } else {
        toast.success(`${buildingIds.length} prédio(s) adicionado(s) com sucesso!`);
      }

      return true;
    } catch (error: any) {
      console.error('❌ [BUILDINGS] Erro ao adicionar prédios:', error);
      toast.error(`Erro ao adicionar prédios: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeBuilding = async (orderId: string, buildingId: string) => {
    setLoading(true);
    try {
      // Get current lista_predios
      const { data: order, error: fetchError } = await supabase
        .from('pedidos')
        .select('lista_predios')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      const currentList: string[] = order?.lista_predios || [];
      const newList = currentList.filter(id => id !== buildingId);

      // Update lista_predios in database
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ lista_predios: newList })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Sync removal with AWS API
      const { data, error: syncError } = await supabase.functions.invoke('sync-buildings-external-api', {
        body: { pedido_id: orderId, action: 'remove', building_ids: [buildingId] }
      });

      if (syncError) {
        console.error('⚠️ [BUILDINGS] Erro ao sincronizar remoção com AWS:', syncError);
        toast.error('Prédio removido do banco, mas houve erro na sincronização AWS.');
      } else {
        toast.success('Prédio removido com sucesso!');
      }

      return true;
    } catch (error: any) {
      console.error('❌ [BUILDINGS] Erro ao remover prédio:', error);
      toast.error(`Erro ao remover prédio: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { addBuildings, removeBuilding, loading };
};
