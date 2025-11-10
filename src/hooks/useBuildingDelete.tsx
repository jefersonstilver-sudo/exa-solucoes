import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useBuildingDelete = () => {
  const [loading, setLoading] = useState(false);

  const deleteBuilding = async (buildingId: string, buildingName: string, onSuccess: () => void) => {
    setLoading(true);

    try {
      console.log('[DELETE BUILDING] Iniciando deleção:', { buildingId, buildingName });

      // Buscar o prédio para obter o codigo_predio
      const { data: building, error: fetchError } = await supabase
        .from('buildings')
        .select('id, nome, codigo_predio')
        .eq('id', buildingId)
        .single();

      if (fetchError || !building) {
        throw new Error('Prédio não encontrado');
      }

      // Usar sempre os primeiros 4 caracteres do UUID do Supabase
      const clienteId = building.id.replace(/-/g, '').substring(0, 4);

      // Chamar Edge Function (proxy) para deletar cliente externo - CRÍTICO
      console.log('[DELETE BUILDING] Deletando cliente externo via Edge Function:', { clienteId });

      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('delete-building-client', {
        body: {
          cliente_id: clienteId
        }
      });

      if (edgeFunctionError) {
        console.error('[DELETE BUILDING] Erro na Edge Function:', edgeFunctionError);
        throw new Error(`Falha ao deletar cliente externo: ${edgeFunctionError.message}`);
      }

      if (edgeFunctionData && !edgeFunctionData.success) {
        console.error('[DELETE BUILDING] Erro ao deletar cliente externo:', edgeFunctionData.error);
        throw new Error(`Falha ao deletar cliente externo: ${edgeFunctionData.error}`);
      }

      console.log('[DELETE BUILDING] Cliente externo deletado com sucesso');

      // Deletar o prédio do banco de dados
      const { error: deleteError } = await supabase
        .from('buildings')
        .delete()
        .eq('id', buildingId);

      if (deleteError) {
        throw deleteError;
      }

      // Log da ação
      await supabase.rpc('log_building_action', {
        p_building_id: buildingId,
        p_action_type: 'delete',
        p_description: `Prédio "${buildingName}" deletado`,
        p_new_values: null,
      });

      toast.success('Prédio deletado com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error('[DELETE BUILDING] Erro ao deletar prédio:', error);
      toast.error(error.message || 'Erro ao deletar prédio');
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteBuilding,
    loading
  };
};
