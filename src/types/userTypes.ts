
import { Session } from '@supabase/supabase-js';

export type UserRole = 'client' | 'admin' | 'super_admin' | 'painel';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  nome?: string; // Adicionar campo nome
  documento?: string; // Adicionar campo documento
  telefone?: string; // Adicionar campo telefone
  avatar_url?: string;
  role?: UserRole;
  data_criacao?: string;
}

export interface UserSessionState {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
}
