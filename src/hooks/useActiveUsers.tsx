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
        const { data, error } = await supabase
          .from('user_sessions')
          .select(`
            *,
            users:user_id (nome, email)
          `)
          .gte('expires_at', new Date().toISOString())
          .order('last_activity', { ascending: false });

        if (error) throw error;

        const formattedSessions = (data || []).map((session: any) => ({
          ...session,
          user_name: session.users?.nome,
          user_email: session.users?.email
        }));

        setSessions(formattedSessions);
        setTotalActive(formattedSessions.length);
      } catch (error) {
        console.error('Error fetching active sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveSessions();

    const interval = setInterval(fetchActiveSessions, 10000);

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
