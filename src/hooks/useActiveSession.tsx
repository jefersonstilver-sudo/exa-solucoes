import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ipGeolocationService } from '@/services/ipGeolocation';
import { v4 as uuidv4 } from 'uuid';

interface UseActiveSessionOptions {
  disabled?: boolean;
}

export const useActiveSession = (options: UseActiveSessionOptions = {}) => {
  const { disabled = false } = options;
  const { userProfile } = useAuth();
  const sessionIdRef = useRef<string>(uuidv4());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Se desabilitado (ex: painéis públicos), não faz nada
    if (disabled) {
      console.log('🚫 useActiveSession: Desabilitado para esta rota');
      return;
    }
    
    console.log('🔵 useActiveSession: Iniciando...');
    const sessionId = sessionIdRef.current;

    const startSession = async () => {
      try {
        console.log('🔵 [RASTREAMENTO AVANÇADO] Iniciando captura completa de dados...');
        
        // 1. OBTER IP REAL (múltiplos serviços)
        const ip = await ipGeolocationService.getRealIP();
        console.log('✅ IP real capturado:', ip);

        // 2. CAPTURAR INFORMAÇÕES DO DISPOSITIVO
        const screenInfo = {
          width: window.screen.width,
          height: window.screen.height,
          colorDepth: window.screen.colorDepth,
          pixelRatio: window.devicePixelRatio
        };

        // 3. INFORMAÇÕES DO NAVEGADOR
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;
        const languages = navigator.languages?.join(',') || language;
        const platform = navigator.platform;
        
        // 4. HARDWARE (quando disponível)
        const cpuCores = (navigator as any).hardwareConcurrency || null;
        const deviceMemory = (navigator as any).deviceMemory || null;

        // 5. REFERRER E UTM PARAMETERS
        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get('utm_source') || null;
        const utmMedium = urlParams.get('utm_medium') || null;
        const utmCampaign = urlParams.get('utm_campaign') || null;
        const referrer = document.referrer || null;

        console.log('📱 [DEVICE] Screen:', screenInfo, 'CPU:', cpuCores, 'RAM:', deviceMemory, 'GB');
        console.log('🌍 [LOCALE] Timezone:', timezone, 'Language:', language);
        console.log('🔗 [TRACKING] Referrer:', referrer, 'UTM:', { utmSource, utmMedium, utmCampaign });

        // 6. GEOLOCALIZAÇÃO AVANÇADA
        console.log('🔵 [GEO] Buscando geolocalização detalhada para IP:', ip);
        const location = await ipGeolocationService.getIPLocation(ip);
        
        if (location) {
          console.log('✅ [GEO] Localização completa obtida:', {
            country: location.country,
            city: location.city,
            isp: location.isp,
            asn: location.asn,
            vpn: location.is_vpn,
            timezone: location.timezone
          });
        } else {
          console.warn('⚠️ [GEO] Falha ao obter geolocalização - dados limitados');
        }

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
          // NOVOS CAMPOS AVANÇADOS
          timezone,
          language,
          languages,
          screen_width: screenInfo.width,
          screen_height: screenInfo.height,
          screen_color_depth: screenInfo.colorDepth,
          pixel_ratio: screenInfo.pixelRatio,
          isp: location?.isp || null,
          asn: location?.asn || null,
          org: location?.org || null,
          platform,
          cpu_cores: cpuCores,
          device_memory: deviceMemory,
          referrer,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        };

        console.log('🔵 [DATABASE] Inserindo sessão completa:', sessionData);

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

        console.log('🔵 [SYSTEM EVENT] Registrando evento de início de sessão...');
        await supabase.from('log_eventos_sistema').insert({
          tipo_evento: 'USER_SESSION_START',
          descricao: `🌍 ${location?.city || 'Unknown'}, ${location?.region || 'Unknown'} - ${location?.country || 'Unknown'} | ⏰ ${timezone} | ${location?.is_vpn ? '🔴 VPN/PROXY' : '✅ Direct'} | 📡 ${location?.isp || 'Unknown ISP'} | 💻 ${platform} | 🖥️ ${screenInfo.width}x${screenInfo.height} | 🧠 ${cpuCores || '?'} cores | 💾 ${deviceMemory || '?'}GB`,
          ip,
          user_agent: navigator.userAgent
        });
        
        console.log('✅ [SUCCESS] Sessão rastreada completamente:', {
          location: `${location?.city}, ${location?.country}`,
          vpn: location?.is_vpn,
          isp: location?.isp,
          screen: `${screenInfo.width}x${screenInfo.height}`
        });
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
  }, [userProfile?.id, disabled]);
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
