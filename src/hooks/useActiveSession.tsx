import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ipGeolocationService } from '@/services/ipGeolocation';
import { v4 as uuidv4 } from 'uuid';

export const useActiveSession = () => {
  const { userProfile } = useAuth();
  const sessionIdRef = useRef<string>(uuidv4());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const sessionId = sessionIdRef.current;

    const startSession = async () => {
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();

        const location = await ipGeolocationService.getIPLocation(ip);

        const { error } = await supabase.from('user_sessions').upsert({
          session_id: sessionId,
          user_id: userProfile?.id || null,
          ip_address: ip,
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          browser: getBrowserInfo(),
          country: location?.country,
          country_code: location?.country_code,
          region: location?.region,
          city: location?.city,
          latitude: location?.latitude,
          longitude: location?.longitude,
          is_vpn: location?.is_vpn,
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        });

        if (error) {
          console.error('Error creating session:', error);
          return;
        }

        console.log('✅ Session started:', sessionId);

        await supabase.from('log_eventos_sistema').insert({
          tipo_evento: 'USER_SESSION_START',
          descricao: `Sessão iniciada: ${location?.city}, ${location?.region} - ${location?.country}`,
          ip,
          user_agent: navigator.userAgent
        });
      } catch (error) {
        console.error('Error starting session:', error);
      }
    };

    const updateHeartbeat = async () => {
      try {
        await supabase.from('user_sessions').update({
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }).eq('session_id', sessionId);
      } catch (error) {
        console.error('Error updating heartbeat:', error);
      }
    };

    const endSession = async () => {
      try {
        await supabase.from('user_sessions').delete().eq('session_id', sessionId);
        console.log('✅ Session ended:', sessionId);
      } catch (error) {
        console.error('Error ending session:', error);
      }
    };

    startSession();
    heartbeatIntervalRef.current = setInterval(updateHeartbeat, 2 * 60 * 1000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      endSession();
    };
  }, [userProfile?.id]);
};

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Other';
}
