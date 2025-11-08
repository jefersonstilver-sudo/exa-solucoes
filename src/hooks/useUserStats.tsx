import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserStats {
  total_users: number;
  admins_count: number;
  super_admins_count: number;
  clients_count: number;
  other_count: number;
  users_this_month: number;
  verified_users: number;
}

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats>({
    total_users: 0,
    admins_count: 0,
    super_admins_count: 0,
    clients_count: 0,
    other_count: 0,
    users_this_month: 0,
    verified_users: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_stats');

      if (error) throw error;

      if (data) {
        const parsedStats = typeof data === 'string' ? JSON.parse(data) : data;
        setStats(parsedStats as UserStats);
      }
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas de usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, []);

  return {
    stats,
    loading,
    refetch: fetchUserStats,
  };
};
