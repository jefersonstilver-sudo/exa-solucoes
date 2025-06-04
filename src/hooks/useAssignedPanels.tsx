
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseAssignedPanelsProps {
  buildingId?: string;
  onRefresh?: () => void;
}

export const useAssignedPanels = ({ buildingId, onRefresh }: UseAssignedPanelsProps) => {
  const [selectedPanel, setSelectedPanel] = useState<any>(null);
  const [isPanelDetailsOpen, setIsPanelDetailsOpen] = useState(false);
  const [unassigningPanelId, setUnassigningPanelId] = useState<string | null>(null);

  const handleViewPanelDetails = (panel: any) => {
    console.log('👁️ [ASSIGNED PANELS] Abrindo detalhes do painel:', panel.code);
    setSelectedPanel(panel);
    setIsPanelDetailsOpen(true);
  };

  const handleUnassignPanel = async (panel: any) => {
    if (!confirm(`Tem certeza que deseja desatribuir o painel "${panel.code}" deste prédio?`)) {
      return;
    }

    setUnassigningPanelId(panel.id);
    try {
      console.log('🔄 [ASSIGNED PANELS] Desatribuindo painel:', panel.code);
      
      const { error } = await supabase
        .from('painels')
        .update({ building_id: null })
        .eq('id', panel.id);

      if (error) {
        console.error('❌ [ASSIGNED PANELS] Erro ao desatribuir painel:', error);
        throw error;
      }

      // Log da ação
      const { error: logError } = await supabase
        .from('building_action_logs')
        .insert({
          building_id: buildingId,
          action_type: 'unassign_panel',
          action_description: `Painel ${panel.code} desatribuído do prédio`,
          old_values: { panel_id: panel.id, panel_code: panel.code }
        });

      if (logError) {
        console.warn('⚠️ [ASSIGNED PANELS] Erro ao registrar log:', logError);
      }

      console.log('✅ [ASSIGNED PANELS] Painel desatribuído com sucesso');
      toast.success(`Painel ${panel.code} desatribuído com sucesso!`);
      
      // Atualizar lista
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('💥 [ASSIGNED PANELS] Erro ao desatribuir painel:', error);
      toast.error('Erro ao desatribuir painel');
    } finally {
      setUnassigningPanelId(null);
    }
  };

  return {
    selectedPanel,
    isPanelDetailsOpen,
    setIsPanelDetailsOpen,
    unassigningPanelId,
    handleViewPanelDetails,
    handleUnassignPanel
  };
};
