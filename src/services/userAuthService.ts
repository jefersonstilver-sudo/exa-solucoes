import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/userTypes';
import { updateUserRoleInDB } from './userRoleService';

/**
 * Logs out the current user
 * @returns Success status and any error
 */
export const logoutUser = async (): Promise<{success: boolean, error?: any}> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error };
    }
    
    // Clear local storage (carts, preferences, etc)
    localStorage.removeItem('indexa_cart');
    localStorage.removeItem('indexa_preferences');
    localStorage.removeItem('panelCart'); // Make sure we clear any cart data
    
    return { success: true };
  } catch (error) {
    console.error('Error logging out:', error);
    return { success: false, error };
  }
};

/**
 * Updates a user's profile information
 * @param userProfile The profile data to update
 * @param currentUserId The ID of the current user
 * @returns Success status and any error
 */
export const updateUserProfileData = async (
  userProfile: Partial<UserProfile>, 
  currentUserId?: string
): Promise<{success: boolean, error?: any}> => {
  try {
    // Update auth metadata
    const { data, error } = await supabase.auth.updateUser({
      data: userProfile
    });
    
    if (error) {
      return { success: false, error };
    }
    
    // If trying to update role, we also need to update the users table
    if (userProfile.role && currentUserId) {
      const roleUpdateResult = await updateUserRoleInDB(currentUserId, userProfile.role);
      
      if (!roleUpdateResult.success) {
        return roleUpdateResult;
      }
    }
    
    if (!data.user) {
      return { success: false, error: new Error('Failed to update user profile') };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error };
  }
};

/**
 * Updates a user's role for both auth metadata and database
 * @param userId The ID of the user to update
 * @param role The new role to assign
 * @returns Success status and any error
 */
export const setUserRoleData = async (
  userId: string, 
  role: UserRole
): Promise<{success: boolean, error?: any}> => {
  try {
    // Update the users table (source of truth)
    const dbUpdateResult = await updateUserRoleInDB(userId, role);
      
    if (!dbUpdateResult.success) {
      return dbUpdateResult;
    }
    
    // Also update auth metadata to keep them in sync
    const { data, error } = await supabase.auth.updateUser({
      data: { role }
    });
    
    if (error) {
      return { success: false, error };
    }
    
    if (!data.user) {
      return { success: false, error: new Error('Failed to update user role') };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating role:', error);
    return { success: false, error };
  }
};
