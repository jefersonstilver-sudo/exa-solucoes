
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building } from './buildingsDataService';

export const updateBuildingInDatabase = async (id: string, updates: Partial<Building>) => {
  try {
    // Garantir que venue_type seja sempre válido (Residencial ou Comercial)
    const updatesWithDefaults = {
      ...updates,
      venue_type: (updates.venue_type === 'Residencial' || updates.venue_type === 'Comercial') 
        ? updates.venue_type 
        : 'Residencial'
    };

    const { error } = await supabase
      .from('buildings')
      .update(updatesWithDefaults)
      .eq('id', id);

    if (error) throw error;

    // Log da ação
    await supabase.rpc('log_building_action', {
      p_building_id: id,
      p_action_type: 'update',
      p_description: 'Prédio atualizado via gerenciamento completo',
      p_new_values: updatesWithDefaults
    });

    toast.success('Prédio atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar prédio:', error);
    toast.error('Erro ao atualizar prédio');
    throw error;
  }
};

export const deleteBuildingFromDatabase = async (id: string) => {
  try {
    const { error } = await supabase
      .from('buildings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log da ação
    await supabase.rpc('log_building_action', {
      p_building_id: id,
      p_action_type: 'delete',
      p_description: 'Prédio excluído',
      p_new_values: {}
    });

    toast.success('Prédio excluído com sucesso!');
  } catch (error) {
    console.error('Erro ao excluir prédio:', error);
    toast.error('Erro ao excluir prédio');
    throw error;
  }
};

export const updateBuildingCode = async (id: string, newCode: string) => {
  try {
    const { error } = await supabase
      .from('buildings')
      .update({ codigo_predio: newCode })
      .eq('id', id);

    if (error) throw error;

    // Log da ação
    await supabase.rpc('log_building_action', {
      p_building_id: id,
      p_action_type: 'update',
      p_description: `Código do prédio atualizado para: ${newCode}`,
      p_new_values: { codigo_predio: newCode }
    });

    toast.success('Código do prédio atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar código:', error);
    toast.error('Erro ao atualizar código do prédio');
    throw error;
  }
};
