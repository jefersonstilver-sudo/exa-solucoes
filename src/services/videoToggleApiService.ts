import { supabase } from '@/integrations/supabase/client';

/**
 * Normalize video title by removing file extension
 */
export const normalizeTitle = (title: string): string => {
  if (!title) return '';
  
  // Remove common video file extensions
  return title.replace(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i, '');
};

/**
 * Toggle video activation for multiple buildings via Edge Function
 */
export const toggleForBuildings = async (
  titulo: string, 
  ativo: boolean, 
  buildingIds: string[]
): Promise<boolean> => {
  try {
    console.log(`🔄 [TOGGLE_API] Toggling "${titulo}" to ${ativo ? 'ACTIVE' : 'INACTIVE'} for buildings:`, buildingIds);
    
    if (!buildingIds.length) {
      console.warn('⚠️ [TOGGLE_API] No building IDs provided');
      return true; // No buildings to notify, consider success
    }

    const normalizedTitle = normalizeTitle(titulo);
    
    const { data, error } = await supabase.functions.invoke('toggle-video-active', {
      body: {
        titulo: normalizedTitle,
        ativo,
        buildingIds
      }
    });

    if (error) {
      console.error('❌ [TOGGLE_API] Edge Function error:', error);
      return false;
    }

    if (data?.success) {
      console.log('✅ [TOGGLE_API] Toggle successful:', data.summary);
      return true;
    } else {
      console.warn('⚠️ [TOGGLE_API] Some toggles failed:', data);
      // Return true if at least some succeeded (partial success is acceptable)
      return data?.summary?.successes > 0;
    }
    
  } catch (error) {
    console.error('💥 [TOGGLE_API] Unexpected error:', error);
    return false;
  }
};

/**
 * Helper to get building IDs for an order
 */
export const getBuildingIdsForOrder = async (orderId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('lista_predios')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('❌ [TOGGLE_API] Error fetching building IDs:', error);
      return [];
    }

    if (!data?.lista_predios) {
      console.warn('⚠️ [TOGGLE_API] No building IDs found for order:', orderId);
      return [];
    }

    // lista_predios should be an array of building IDs
    const buildingIds = Array.isArray(data.lista_predios) ? data.lista_predios : [];
    console.log('📍 [TOGGLE_API] Found building IDs:', buildingIds);
    
    return buildingIds;
    
  } catch (error) {
    console.error('💥 [TOGGLE_API] Error getting building IDs:', error);
    return [];
  }
};