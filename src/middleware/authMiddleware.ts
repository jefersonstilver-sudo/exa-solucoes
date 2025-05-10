
import { NextApiRequest, NextApiResponse } from 'next';
import { validateToken, UserRole } from '../lib/auth';

type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

/**
 * Middleware that checks if the user is authenticated
 * @param handler API route handler
 * @returns Modified handler with authentication check
 */
export function withAuth(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const user = await validateToken(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    // Add user to request object
    (req as any).user = user;
    
    return handler(req, res);
  };
}

/**
 * Middleware that checks if the user has a specific role
 * @param handler API route handler
 * @param role Required role for access
 * @returns Modified handler with role check
 */
export function withRole(handler: NextApiHandler, role: UserRole): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const user = await validateToken(token);
    
    if (!user || !user.role || user.role !== role) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
    
    // Add user to request object
    (req as any).user = user;
    
    return handler(req, res);
  };
}

/**
 * Middleware that checks if the user has any of the specified roles
 * @param handler API route handler
 * @param roles Array of roles that are allowed access
 * @returns Modified handler with role check
 */
export function withRoles(handler: NextApiHandler, roles: UserRole[]): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const user = await validateToken(token);
    
    if (!user || !user.role || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
    
    // Add user to request object
    (req as any).user = user;
    
    return handler(req, res);
  };
}
