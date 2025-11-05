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
    console.log('🔵 useActiveSession: Iniciando...');
    const sessionId = sessionIdRef.current;

    const startSession = async () => {
      try {
        console.log('🔵 Buscando IP do usuário...');
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();
        console.log('✅ IP obtido:', ip);

        console.log('🔵 Buscando geolocalização...');
        const location = await ipGeolocationService.getIPLocation(ip);
        console.log('✅ Localização obtida:', location);

        const sessionData = {
          session_id: sessionId,
          user_id: userProfile?.id || null,
          ip_address: ip,
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          browser: getBrowserInfo(),
          country: location?.country || 'Unknown',
          country_code: location?.country_code || 'XX',
          region: location?.region || 'Unknown',
          city: location?.city || 'Unknown',
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0,
          is_vpn: location?.is_vpn || false,
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        };

        console.log('🔵 Tentando inserir sessão:', sessionData);

        const { data, error } = await supabase
          .from('user_sessions')
          .upsert(sessionData)
          .select();

        if (error) {
          console.error('❌ Erro ao criar sessão:', error);
          return;
        }

        console.log('✅ Sessão criada com sucesso:', data);

        console.log('🔵 Registrando evento de sistema...');
        await supabase.from('log_eventos_sistema').insert({
          tipo_evento: 'USER_SESSION_START',
          descricao: `Sessão iniciada: ${location?.city}, ${location?.region} - ${location?.country}`,
          ip,
          user_agent: navigator.userAgent
        });
        
        console.log('✅ Evento registrado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao iniciar sessão:', error);
      }
    };

    const updateHeartbeat = async () => {
      try {
        console.log('💓 Atualizando heartbeat...');
        await supabase.from('user_sessions').update({
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }).eq('session_id', sessionId);
      } catch (error) {
        console.error('❌ Erro ao atualizar heartbeat:', error);
      }
    };

    const endSession = async () => {
      try {
        console.log('🔴 Encerrando sessão:', sessionId);
        await supabase.from('user_sessions').delete().eq('session_id', sessionId);
        console.log('✅ Sessão encerrada');
      } catch (error) {
        console.error('❌ Erro ao encerrar sessão:', error);
      }
    };

    console.log('🔵 Iniciando sessão...');
    startSession();
    
    console.log('🔵 Configurando heartbeat a cada 2 minutos');
    heartbeatIntervalRef.current = setInterval(updateHeartbeat, 2 * 60 * 1000);

    return () => {
      console.log('🔴 Limpando useActiveSession');
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
