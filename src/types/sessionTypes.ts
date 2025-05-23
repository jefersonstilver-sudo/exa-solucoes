
import { Session } from '@supabase/supabase-js';
import { UserProfile, UserRole } from './userTypes';

export interface UserSessionState {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isLoggedIn: boolean;
}

export interface UserSessionHookReturn extends UserSessionState {
  sessionUser: UserProfile | null; // Alias to user for backward compatibility
  logout: () => Promise<void>;
  updateUserProfile: (userProfile: Partial<UserProfile>) => Promise<{success: boolean, error?: any}>;
  hasRole: (requiredRole: UserRole) => boolean;
  setUserRole: (role: UserRole) => Promise<{success: boolean, error?: any}>;
}
