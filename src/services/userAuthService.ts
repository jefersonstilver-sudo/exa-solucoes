
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/userTypes';

/**
 * Simplified user auth service - uses users table as source of truth
 */

/**
 * Logs out the current user
 */
export const logoutUser = async (): Promise<{success: boolean, error?: any}> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error };
    }
    
    // Clear local storage
    localStorage.clear();
    
    return { success: true };
  } catch (error) {
    console.error('Error logging out:', error);
    return { success: false, error };
  }
};

/**
 * Updates a user's profile information (simplified)
 */
export const updateUserProfileData = async (
  userProfile: Partial<UserProfile>, 
  currentUserId?: string
): Promise<{success: boolean, error?: any}> => {
  try {
    if (!currentUserId) {
      return { success: false, error: new Error('User ID required') };
    }

    // Update users table (source of truth)
    if (userProfile.role) {
      const { error } = await supabase
        .from('users')
        .update({ role: userProfile.role })
        .eq('id', currentUserId);
      
      if (error) {
        return { success: false, error };
      }
      
      // Trigger will automatically sync metadata
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error };
  }
};

/**
 * Sets a user's role (simplified - only updates users table, trigger handles sync)
 */
export const setUserRoleData = async (
  userId: string, 
  role: UserRole
): Promise<{success: boolean, error?: any}> => {
  try {
    // Update users table - trigger will handle auth metadata sync
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);
      
    if (error) {
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating role:', error);
    return { success: false, error };
  }
};
