
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
      console.warn('🚫 [PANEL ASSIGNMENT] Nenhum painel selecionado');
      toast.warning('Selecione pelo menos um painel para atribuir');
      return false;
    }

    console.log('🚀 [PANEL ASSIGNMENT] INICIANDO PROCESSO:', {
      buildingId,
      buildingName,
      panelCount: panelIds.length,
      panelIds,
      timestamp: new Date().toISOString()
    });

    setLoading(true);
    setAssigningPanels(panelIds);

    try {
      // 1. Verificar permissões do usuário atual
      console.log('🔐 [PANEL ASSIGNMENT] Verificando permissões...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ [PANEL ASSIGNMENT] Usuário não autenticado:', userError);
        throw new Error('Usuário não autenticado');
      }

      console.log('👤 [PANEL ASSIGNMENT] Usuário autenticado:', {
        userId: user.id,
        email: user.email
      });

      // 2. Verificar dados do usuário na tabela users
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData) {
        console.error('❌ [PANEL ASSIGNMENT] Dados do usuário não encontrados:', userDataError);
        throw new Error('Dados do usuário não encontrados');
      }

      console.log('📊 [PANEL ASSIGNMENT] Dados do usuário:', userData);

      if (!['admin', 'super_admin'].includes(userData.role)) {
        console.error('🚫 [PANEL ASSIGNMENT] Usuário sem permissão:', userData.role);
        throw new Error('Usuário sem permissão para atribuir painéis');
      }

      // 3. Verificar se os painéis existem e estão disponíveis
      console.log('🔍 [PANEL ASSIGNMENT] Verificando painéis selecionados...');
      const { data: existingPanels, error: checkError } = await supabase
        .from('painels')
        .select('id, code, building_id, status')
        .in('id', panelIds);

      if (checkError) {
        console.error('❌ [PANEL ASSIGNMENT] Erro ao verificar painéis:', checkError);
        throw new Error('Erro ao verificar painéis: ' + checkError.message);
      }

      console.log('📋 [PANEL ASSIGNMENT] Painéis encontrados:', existingPanels);

      if (!existingPanels || existingPanels.length !== panelIds.length) {
        const foundIds = existingPanels?.map(p => p.id) || [];
        const missingIds = panelIds.filter(id => !foundIds.includes(id));
        console.error('❌ [PANEL ASSIGNMENT] Painéis não encontrados:', missingIds);
        throw new Error(`Painéis não encontrados: ${missingIds.join(', ')}`);
      }

      // 4. Verificar se algum painel já está atribuído
      const alreadyAssigned = existingPanels.filter(p => p.building_id !== null);
      if (alreadyAssigned.length > 0) {
        const assignedCodes = alreadyAssigned.map(p => p.code).join(', ');
        console.warn('⚠️ [PANEL ASSIGNMENT] Painéis já atribuídos:', alreadyAssigned);
        toast.error(`Os seguintes painéis já estão atribuídos: ${assignedCodes}`);
        return false;
      }

      console.log('✅ [PANEL ASSIGNMENT] Todos os painéis estão disponíveis');

      // 5. Verificar se o prédio existe
      console.log('🏢 [PANEL ASSIGNMENT] Verificando prédio...');
      const { data: buildingData, error: buildingError } = await supabase
        .from('buildings')
        .select('id, nome')
        .eq('id', buildingId)
        .single();

      if (buildingError || !buildingData) {
        console.error('❌ [PANEL ASSIGNMENT] Prédio não encontrado:', buildingError);
        throw new Error('Prédio não encontrado');
      }

      console.log('🏢 [PANEL ASSIGNMENT] Prédio validado:', buildingData);

      // 6. Executar a atribuição
      console.log('🔄 [PANEL ASSIGNMENT] Executando atribuição...');
      const { data: updateData, error: updateError } = await supabase
        .from('painels')
        .update({ building_id: buildingId })
        .in('id', panelIds)
        .select('id, code, building_id');

      if (updateError) {
        console.error('❌ [PANEL ASSIGNMENT] Erro na atribuição:', updateError);
        throw new Error('Erro ao atribuir painéis: ' + updateError.message);
      }

      console.log('✅ [PANEL ASSIGNMENT] Atribuição executada com sucesso:', updateData);

      // 7. Preparar dados para o log
      const panelCodes = existingPanels.map(p => p.code);
      
      console.log('📝 [PANEL ASSIGNMENT] Preparando log da ação...');

      // 8. Registrar log da ação
      try {
        const { data: logData, error: logError } = await supabase.rpc('log_building_action', {
          p_building_id: buildingId,
          p_action_type: 'assign_panels',
          p_description: `${panelIds.length} painéis atribuídos ao prédio "${buildingName}": ${panelCodes.join(', ')}`,
          p_new_values: { 
            panel_ids: panelIds, 
            panel_codes: panelCodes, 
            building_name: buildingName,
            assigned_by: userData.email,
            assigned_at: new Date().toISOString()
          }
        });
        
        if (logError) {
          console.warn('⚠️ [PANEL ASSIGNMENT] Erro no log (não crítico):', logError);
        } else {
          console.log('📝 [PANEL ASSIGNMENT] Log registrado:', logData);
        }
      } catch (logError) {
        console.warn('⚠️ [PANEL ASSIGNMENT] Falha ao registrar log (não crítico):', logError);
      }

      // 9. Sucesso
      console.log('🎉 [PANEL ASSIGNMENT] PROCESSO CONCLUÍDO COM SUCESSO');
      toast.success(`${panelIds.length} painéis atribuídos com sucesso ao prédio "${buildingName}"!`);
      
      // Aguardar um pouco para garantir que a operação foi processada
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSuccess();
      return true;

    } catch (error: any) {
      console.error('💥 [PANEL ASSIGNMENT] ERRO CRÍTICO:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        timestamp: new Date().toISOString()
      });
      
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
      console.log('🏁 [PANEL ASSIGNMENT] Finalizando processo...');
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
