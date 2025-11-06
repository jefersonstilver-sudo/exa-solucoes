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
  created_at?: string;
  user_name?: string;
  user_email?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  asn?: string;
  org?: string;
  platform?: string;
  screen_width?: number;
  screen_height?: number;
  pixel_ratio?: number;
  cpu_cores?: number;
  device_memory?: number;
  timezone?: string;
  language?: string;
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

        // Buscar dados dos usuários usando edge function segura
        const userIds = sessions?.filter(s => s.user_id).map(s => s.user_id) || [];
        let usersData: any[] = [];
        
        if (userIds.length > 0) {
          console.log('🔍 Buscando dados de usuários para IDs:', userIds);
          
          // Usar edge function para buscar dados estendidos de forma segura
          const { data: usersExtended, error: extendedError } = await supabase.functions.invoke('get-users-extended', {
            body: { userIds }
          });
          
          if (extendedError) {
            console.warn('⚠️ Erro ao buscar dados estendidos:', extendedError);
          } else if (usersExtended) {
            usersData = usersExtended.map((user: any) => ({
              id: user.id,
              nome: user.name || user.email?.split('@')[0],
              email: user.email
            }));
            console.log('✅ Dados estendidos carregados:', usersData.length);
          }
        }

        console.log('📊 Dados finais dos usuários:', usersData);

        // Combinar dados com TODAS as informações avançadas
        const formattedSessions = (sessions || []).map((session: any) => {
          const user = usersData.find(u => u.id === session.user_id);
          
          return {
            ...session,
            user_name: user?.nome || null,
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

    // Setup realtime subscription para atualizações em tempo real
    const channel = supabase
      .channel('active-sessions-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions'
        },
        (payload) => {
          console.log('🔥 Atualização em tempo real na sessão:', payload);
          // Refetch quando houver mudanças
          fetchActiveSessions();
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da conexão realtime:', status);
      });

    // Setup polling como backup (a cada 30 segundos)
    const interval = setInterval(fetchActiveSessions, 30000);

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
