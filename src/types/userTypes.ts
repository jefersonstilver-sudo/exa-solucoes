
import { Session } from '@supabase/supabase-js';

export type UserRole = 'client' | 'admin' | 'super_admin';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: UserRole;
}

export interface UserSessionState {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
}
