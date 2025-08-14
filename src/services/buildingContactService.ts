import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BuildingContactInfo {
  id: string;
  nome_sindico?: string;
  contato_sindico?: string;
  nome_vice_sindico?: string;
  contato_vice_sindico?: string;
  nome_contato_predio?: string;
  numero_contato_predio?: string;
}

/**
 * Fetches sensitive contact information for a specific building
 * Only available to super admins for security reasons
 */
export const fetchBuildingContactInfo = async (buildingId: string): Promise<BuildingContactInfo | null> => {
  try {
    console.log('🔒 [CONTACT SERVICE] Fetching sensitive contact info for building:', buildingId);
    
    const { data, error } = await supabase.rpc('get_building_contact_info', {
      building_id: buildingId
    });

    if (error) {
      console.error('❌ [CONTACT SERVICE] Error fetching contact info:', error);
      toast.error('Erro ao carregar informações de contato');
      return null;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ [CONTACT SERVICE] No contact info found or access denied');
      return null;
    }

    console.log('✅ [CONTACT SERVICE] Contact info loaded successfully');
    return data[0];
  } catch (error) {
    console.error('💥 [CONTACT SERVICE] Critical error:', error);
    toast.error('Erro crítico ao carregar informações de contato');
    return null;
  }
};

/**
 * Checks if current user can access building contact information
 */
export const canAccessBuildingContacts = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('can_access_building_contacts');
    
    if (error) {
      console.error('❌ [CONTACT SERVICE] Error checking contact access:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('💥 [CONTACT SERVICE] Error checking permissions:', error);
    return false;
  }
};