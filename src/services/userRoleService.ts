
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/userTypes';

/**
 * Fetches a user's role from the database
 * @param userId The ID of the user to fetch the role for
 * @returns The user's role or null if not found
 */
export const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
    
    return data?.role as UserRole | null;
  } catch (error) {
    console.error('Exception fetching user role:', error);
    return null;
  }
};

/**
 * Checks if a user has a specific role
 * @param userRole The user's current role
 * @param requiredRole The role to check for
 * @returns Boolean indicating if the user has the required role
 */
export const hasUserRole = (
  userRole: UserRole | undefined, 
  requiredRole: UserRole
): boolean => {
  if (!userRole) return false;
  
  // Super admin has access to all roles
  if (userRole === 'super_admin') return true;
  
  // Admin has access to admin and client roles (but not admin_marketing specific)
  if (userRole === 'admin' && (requiredRole === 'admin' || requiredRole === 'client')) return true;
  
  // Admin marketing has access only to admin_marketing and client roles
  if (userRole === 'admin_marketing' && (requiredRole === 'admin_marketing' || requiredRole === 'client')) return true;
  
  // Client has access only to client role
  if (userRole === 'client' && requiredRole === 'client') return true;
  
  // Painel role - typically for display devices
  if (userRole === 'painel' && requiredRole === 'painel') return true;
  
  return false;
};

/**
 * Updates a user's role in the database
 * @param userId The ID of the user to update
 * @param role The new role to assign
 * @returns Success status and any error
 */
export const updateUserRoleInDB = async (userId: string, role: UserRole): Promise<{success: boolean, error?: any}> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);
      
    if (error) {
      console.error('Error updating role in users table:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Exception updating user role:', error);
    return { success: false, error };
  }
};

/**
 * Get role display information
 */
export const getRoleDisplayInfo = (role: UserRole) => {
  const roleInfo = {
    super_admin: {
      label: 'Super Administrador',
      description: 'Acesso total ao sistema',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    admin: {
      label: 'Administrador Geral',
      description: 'Gestão completa de prédios, painéis e pedidos',
      color: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    admin_marketing: {
      label: 'Administrador Marketing',
      description: 'Gestão de leads, campanhas e conteúdo',
      color: 'bg-purple-100 text-purple-800 border-purple-300'
    },
    client: {
      label: 'Cliente',
      description: 'Acesso às funcionalidades de cliente',
      color: 'bg-gray-100 text-gray-800 border-gray-300'
    },
    painel: {
      label: 'Painel',
      description: 'Dispositivo de exibição',
      color: 'bg-green-100 text-green-800 border-green-300'
    }
  };

  return roleInfo[role] || roleInfo.client;
};
