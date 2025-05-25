
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseAssignmentOperationsProps {
  buildingId: string;
  buildingName: string;
  onSuccess: () => void;
}

export const usePanelAssignment = ({ buildingId, buildingName, onSuccess }: UseAssignmentOperationsProps) => {
  const [loading, setLoading] = useState(false);
  const [assigningPanels, setAssigningPanels] = useState<string[]>([]);

  const assignPanelsToBuilding = useCallback(async (panelIds: string[]) => {
    if (!panelIds.length) {
      toast.warning('Selecione pelo menos um painel para atribuir');
      return false;
    }

    setLoading(true);
    setAssigningPanels(panelIds);

    try {
      console.log('🔄 [PANEL ASSIGNMENT] Iniciando atribuição de painéis:', {
        buildingId,
        buildingName,
        panelCount: panelIds.length,
        panelIds
      });

      // Verificar se algum painel já está atribuído
      const { data: existingAssignments, error: checkError } = await supabase
        .from('painels')
        .select('id, code, building_id')
        .in('id', panelIds)
        .not('building_id', 'is', null);

      if (checkError) {
        console.error('❌ [PANEL ASSIGNMENT] Erro ao verificar painéis:', checkError);
        throw new Error('Erro ao verificar painéis: ' + checkError.message);
      }

      if (existingAssignments && existingAssignments.length > 0) {
        const assignedCodes = existingAssignments.map(p => p.code).join(', ');
        toast.error(`Os seguintes painéis já estão atribuídos: ${assignedCodes}`);
        return false;
      }

      console.log('✅ [PANEL ASSIGNMENT] Painéis validados, procedendo com atribuição...');

      // Atribuir painéis ao prédio
      const { data: updateData, error: updateError } = await supabase
        .from('painels')
        .update({ building_id: buildingId })
        .in('id', panelIds)
        .select('id, code, building_id');

      if (updateError) {
        console.error('❌ [PANEL ASSIGNMENT] Erro na atribuição:', updateError);
        throw new Error('Erro ao atribuir painéis: ' + updateError.message);
      }

      console.log('✅ [PANEL ASSIGNMENT] Painéis atribuídos com sucesso:', updateData);

      // Buscar códigos dos painéis para o log
      const { data: panelData } = await supabase
        .from('painels')
        .select('code')
        .in('id', panelIds);

      const panelCodes = panelData?.map(p => p.code) || [];

      // Log da ação
      try {
        await supabase.rpc('log_building_action', {
          p_building_id: buildingId,
          p_action_type: 'assign_panels',
          p_description: `${panelIds.length} painéis atribuídos ao prédio "${buildingName}": ${panelCodes.join(', ')}`,
          p_new_values: { 
            panel_ids: panelIds, 
            panel_codes: panelCodes, 
            building_name: buildingName 
          }
        });
        console.log('📝 [PANEL ASSIGNMENT] Log da ação registrado com sucesso');
      } catch (logError) {
        console.warn('⚠️ [PANEL ASSIGNMENT] Falha ao registrar log (não crítico):', logError);
      }

      toast.success(`${panelIds.length} painéis atribuídos com sucesso ao prédio "${buildingName}"!`);
      onSuccess();
      return true;

    } catch (error: any) {
      console.error('💥 [PANEL ASSIGNMENT] Erro crítico na atribuição:', error);
      
      // Mensagem de erro mais específica
      let errorMessage = 'Erro desconhecido';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(`Erro ao atribuir painéis: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
      setAssigningPanels([]);
    }
  }, [buildingId, buildingName, onSuccess]);

  return {
    loading,
    assigningPanels,
    assignPanelsToBuilding
  };
};
