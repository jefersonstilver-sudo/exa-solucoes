
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const syncPanel = async (panelId: string) => {
  if (!panelId) {
    toast.error('ID do painel inválido');
    return;
  }

  try {
    console.log('🔄 [BUILDING PANEL OPERATIONS] Sincronizando painel:', panelId);
    
    const { error } = await supabase
      .from('painels')
      .update({ ultima_sync: new Date().toISOString() })
      .eq('id', panelId);

    if (error) throw error;

    toast.success('Painel sincronizado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ [BUILDING PANEL OPERATIONS] Erro ao sincronizar painel:', error);
    toast.error('Erro ao sincronizar painel');
    throw error;
  }
};

export const viewPanelDetails = (panelId: string) => {
  if (!panelId) {
    toast.error('ID do painel inválido');
    return;
  }
  
  console.log('👁️ [BUILDING PANEL OPERATIONS] Visualizar detalhes do painel:', panelId);
  toast.info('Funcionalidade de detalhes do painel em desenvolvimento');
};
