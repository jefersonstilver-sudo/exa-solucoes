import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UserSettings {
  nome: string;
  telefone: string;
  company_name?: string;
}

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    nome: '',
    telefone: '',
    company_name: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      // Buscar dados da tabela users (nome e telefone)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('nome, telefone')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Buscar company_name da tabela profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_name')
        .eq('id', user.id)
        .single();

      // Não lançar erro se profile não existir
      const companyName = profileError ? '' : (profileData?.company_name || '');

      setSettings({
        nome: userData.nome || '',
        telefone: userData.telefone || '',
        company_name: companyName,
      });
    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user?.id) return;

    try {
      // Atualizar nome e telefone na tabela users
      if (updates.nome !== undefined || updates.telefone !== undefined) {
        const userUpdates: any = {};
        if (updates.nome !== undefined) userUpdates.nome = updates.nome;
        if (updates.telefone !== undefined) userUpdates.telefone = updates.telefone;

        const { error: userError } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', user.id);

        if (userError) throw userError;
      }

      // Atualizar company_name na tabela profiles
      if (updates.company_name !== undefined) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ company_name: updates.company_name })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      toast.success('Informações atualizadas com sucesso!');
      await loadSettings();
    } catch (error) {
      console.error('❌ Erro ao atualizar configurações:', error);
      toast.error('Erro ao atualizar informações');
      throw error;
    }
  };

  return { settings, loading, updateSettings, refetch: loadSettings };
};
