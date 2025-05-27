
import { Session } from '@supabase/supabase-js';

export type UserRole = 'client' | 'admin' | 'super_admin' | 'painel';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  nome?: string; // Portuguese name field
  avatar_url?: string;
  role?: UserRole;
  data_criacao?: string;
  documento?: string; // CPF/CNPJ
  telefone?: string; // Phone number
}

export interface UserSessionState {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
}
