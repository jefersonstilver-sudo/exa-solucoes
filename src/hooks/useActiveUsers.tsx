import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveSession {
  id: string;
  user_id: string | null;
  ip_address: string;
  city: string;
  region: string;
  country: string;
  country_code: string;
  device_type: string;
  browser: string;
  is_vpn: boolean;
  last_activity: string;
  user_name?: string;
  user_email?: string;
}

export const useActiveUsers = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        console.log('🔄 Buscando sessões ativas...');
        
        // Buscar sessões ativas com TODAS as informações avançadas
        const { data: sessions, error: sessionsError } = await supabase
          .from('user_sessions')
          .select('*')
          .gte('expires_at', new Date().toISOString())
          .order('last_activity', { ascending: false });

        if (sessionsError) {
          console.error('❌ Erro ao buscar sessões:', sessionsError);
          throw sessionsError;
        }

        console.log('✅ Sessões encontradas:', sessions?.length);

        // Buscar dados dos usuários da tabela users E do auth.users
        const userIds = sessions?.filter(s => s.user_id).map(s => s.user_id) || [];
        let usersData: any[] = [];
        
        if (userIds.length > 0) {
          console.log('🔍 Buscando dados de usuários para IDs:', userIds);
          
          // Primeiro tenta buscar da tabela users
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, nome, email')
            .in('id', userIds);
          
          if (!usersError && users) {
            usersData = users;
            console.log('✅ Dados da tabela users:', users);
          }

          // Para usuários não encontrados, buscar do auth
          for (const userId of userIds) {
            if (!usersData.find(u => u.id === userId)) {
              try {
                const { data: authData } = await supabase.auth.admin.getUserById(userId);
                if (authData?.user) {
                  usersData.push({
                    id: userId,
                    nome: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'Usuário',
                    email: authData.user.email
                  });
                }
              } catch (error) {
                console.log('⚠️ Não foi possível buscar do auth para:', userId);
              }
            }
          }
        }

        console.log('📊 Dados finais dos usuários:', usersData);

        // Combinar dados com TODAS as informações avançadas
        const formattedSessions = (sessions || []).map((session: any) => {
          const user = usersData.find(u => u.id === session.user_id);
          
          return {
            ...session,
            user_name: user?.nome || (session.user_id ? 'Usuário' : null),
            user_email: user?.email || null
          };
        });

        console.log('✅ Sessões formatadas:', formattedSessions);

        setSessions(formattedSessions);
        setTotalActive(formattedSessions.length);
      } catch (error) {
        console.error('Error fetching active sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveSessions();

    const interval = setInterval(fetchActiveSessions, 3000);

    const channel = supabase
      .channel('active-sessions-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions'
        },
        () => {
          fetchActiveSessions();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const sessionsByCountry = sessions.reduce((acc, session) => {
    const country = session.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sessionsByRegion = sessions
    .filter(s => s.country_code === 'BR')
    .reduce((acc, session) => {
      const region = session.region || 'Unknown';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const internationalSessions = sessions.filter(s => s.country_code !== 'BR');
  const vpnSessions = sessions.filter(s => s.is_vpn);

  return {
    sessions,
    totalActive,
    sessionsByCountry,
    sessionsByRegion,
    internationalSessions,
    vpnSessions,
    isLoading
  };
};
