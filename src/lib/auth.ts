
import { supabase } from '@/integrations/supabase/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { filterEq } from '@/utils/supabaseUtils';

// Types for user roles
export type UserRole = 'admin' | 'client' | 'painel';

// User interface with role
export interface User {
  id: string;
  email: string;
  role: UserRole;
  data_criacao: string;
}

/**
 * Validates a JWT token and returns the user if valid
 * @param token JWT token to validate
 * @returns User object or null if invalid
 */
export const validateToken = async (token: string): Promise<User | null> => {
  try {
    const { data: user, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    // Get additional user data with role
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, role, created_at as data_criacao')
      .eq('id', filterEq(user.user.id))
      .single();
      
    if (!userData) {
      return null;
    }
    
    return userData as unknown as User;
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
};

/**
 * Middleware to check if a user has the required role
 * @param req Next.js API request
 * @param res Next.js API response
 * @param requiredRole Role required to access the endpoint
 * @returns Boolean indicating if the user has access
 */
export const checkRole = async (
  req: NextApiRequest,
  res: NextApiResponse,
  requiredRole: UserRole
): Promise<boolean> => {
  // Get token from Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'Unauthorized - No token provided' });
    return false;
  }
  
  const user = await validateToken(token);
  
  if (!user || !user.role || user.role !== requiredRole) {
    res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    return false;
  }
  
  return true;
};

// Helper to extract the JWT from request headers
export const getTokenFromHeader = (req: NextApiRequest): string | null => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    return token || null;
  } catch (err) {
    return null;
  }
};

// Helper to verify multiple allowed roles
export const hasRole = async (user: User, allowedRoles: UserRole[]): Promise<boolean> => {
  return allowedRoles.includes(user.role);
};
