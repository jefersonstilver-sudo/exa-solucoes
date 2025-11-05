import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useOrderViewTracking = () => {
  const { userProfile } = useAuth();

  const trackOrderView = useCallback(
    async (orderId: string) => {
      if (!userProfile?.id) return;

      try {
        await supabase.rpc('log_client_activity', {
          p_user_id: userProfile.id,
          p_event_type: 'order_view',
          p_event_data: {
            order_id: orderId,
            timestamp: new Date().toISOString(),
          },
        });
        
        console.log('✅ Order view tracked:', orderId);
      } catch (error) {
        console.error('❌ Error tracking order view:', error);
      }
    },
    [userProfile?.id]
  );

  return { trackOrderView };
};
