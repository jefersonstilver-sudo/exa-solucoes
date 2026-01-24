import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useLoginTracking = () => {
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile?.id) return;

    const trackLogin = async () => {
      try {
        await supabase.rpc('log_client_activity', {
          p_user_id: userProfile.id,
          p_event_type: 'login',
          p_event_data: {
            timestamp: new Date().toISOString(),
            device: getDeviceType(),
            browser: getBrowserInfo(),
          },
        });
        
        console.log('✅ Login tracked for user:', userProfile.id);
      } catch (error) {
        // CRITICAL: Log silencioso - NUNCA propagar erro para não travar a UI
        console.warn('⚠️ Login tracking failed (non-blocking):', error);
      }
    };

    // Executar de forma não-bloqueante
    trackLogin().catch(() => {
      // Fallback silencioso final
    });
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
