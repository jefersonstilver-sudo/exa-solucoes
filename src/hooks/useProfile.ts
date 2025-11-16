import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Se não existe perfil, cria um novo
        if (error.code === 'PGRST116') {
          await createProfile();
        } else {
          console.error('Erro ao carregar perfil:', error);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            full_name: user.user_metadata?.full_name || '',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('Usuário não autenticado') };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      toast.success('Perfil atualizado com sucesso!');
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
      return { data: null, error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Senha atualizada com sucesso!');
      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      toast.error('Erro ao atualizar senha');
      return { error };
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    updatePassword,
    refetch: fetchProfile,
  };
};
