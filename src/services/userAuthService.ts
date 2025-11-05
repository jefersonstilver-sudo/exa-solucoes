
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
 * Updates a user's profile information (DEPRECATED - use useSecureAdmin hook instead)
 * This function should not be used for role updates - use admin_update_user_role_secure RPC
 */
export const updateUserProfileData = async (
  userProfile: Partial<UserProfile>, 
  currentUserId?: string
): Promise<{success: boolean, error?: any}> => {
  try {
    if (!currentUserId) {
      return { success: false, error: new Error('User ID required') };
    }

    // SECURITY: Role updates should use admin_update_user_role_secure RPC
    // This function is deprecated for role updates
    if (userProfile.role) {
      console.warn('SECURITY WARNING: Direct role update attempted via userAuthService. Use admin_update_user_role_secure RPC instead.');
      return { success: false, error: new Error('Use admin_update_user_role_secure RPC for role updates') };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error };
  }
};

/**
 * Sets a user's role (DEPRECATED - use useSecureAdmin hook instead)
 * SECURITY: This function should NOT be used. Use admin_update_user_role_secure RPC instead.
 */
export const setUserRoleData = async (
  userId: string, 
  role: UserRole
): Promise<{success: boolean, error?: any}> => {
  console.warn('SECURITY WARNING: setUserRoleData is deprecated. Use admin_update_user_role_secure RPC via useSecureAdmin hook.');
  return { 
    success: false, 
    error: new Error('Use admin_update_user_role_secure RPC for role updates') 
  };
};
