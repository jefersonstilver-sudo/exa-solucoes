
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseAvailablePanelsProps {
  buildingId?: string;
  open: boolean;
  onPanelAssigned?: () => void;
}

export const useAvailablePanels = ({ buildingId, open, onPanelAssigned }: UseAvailablePanelsProps) => {
  const [availablePanels, setAvailablePanels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningPanelId, setAssigningPanelId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAvailablePanels = useCallback(async () => {
    if (!open) return;
    
    setLoading(true);
    try {
      console.log('🔍 [AVAILABLE PANELS] Buscando painéis disponíveis...');
      
      const { data, error } = await supabase
        .from('painels')
        .select('*')
        .is('building_id', null)
        .order('code');

      if (error) {
        console.error('❌ [AVAILABLE PANELS] Erro ao buscar painéis:', error);
        throw error;
      }
      
      console.log('✅ [AVAILABLE PANELS] Painéis carregados:', data?.length || 0);
      setAvailablePanels(data || []);
    } catch (error) {
      console.error('💥 [AVAILABLE PANELS] Erro crítico:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os painéis disponíveis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [open, toast]);

  const assignPanel = async (panelId: string, panelCode: string) => {
    if (!buildingId) {
      console.error('❌ [AVAILABLE PANELS] Building ID não fornecido');
      return;
    }

    setAssigningPanelId(panelId);
    try {
      console.log('📌 [AVAILABLE PANELS] Atribuindo painel:', panelCode, 'ao prédio:', buildingId);
      
      const { error } = await supabase
        .from('painels')
        .update({ building_id: buildingId })
        .eq('id', panelId);

      if (error) {
        console.error('❌ [AVAILABLE PANELS] Erro ao atribuir painel:', error);
        throw error;
      }
      
      // Log da ação
      const { error: logError } = await supabase
        .from('building_action_logs')
        .insert({
          building_id: buildingId,
          action_type: 'assign_panel',
          action_description: `Painel ${panelCode} atribuído ao prédio`,
          new_values: { panel_id: panelId, panel_code: panelCode }
        });

      if (logError) {
        console.warn('⚠️ [AVAILABLE PANELS] Erro ao registrar log:', logError);
      }
      
      console.log('✅ [AVAILABLE PANELS] Painel atribuído com sucesso');
      
      toast({
        title: "Sucesso",
        description: `Painel ${panelCode} atribuído com sucesso!`,
      });
      
      // Recarregar lista de painéis disponíveis
      fetchAvailablePanels();
      
      // Notificar o componente pai para atualizar painéis atribuídos
      if (onPanelAssigned) {
        onPanelAssigned();
      }
    } catch (error) {
      console.error('💥 [AVAILABLE PANELS] Erro ao atribuir painel:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atribuir o painel.",
        variant: "destructive",
      });
    } finally {
      setAssigningPanelId(null);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAvailablePanels();
    } else {
      setAvailablePanels([]);
    }
  }, [open, fetchAvailablePanels]);

  return {
    availablePanels,
    loading,
    assigningPanelId,
    assignPanel,
    fetchAvailablePanels
  };
};
