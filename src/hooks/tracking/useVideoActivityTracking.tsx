import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useVideoActivityTracking = () => {
  const { userProfile } = useAuth();

  const trackVideoUpload = useCallback(
    async (videoId: string, pedidoId: string) => {
      if (!userProfile?.id) return;

      try {
        await supabase.rpc('log_client_activity', {
          p_user_id: userProfile.id,
          p_event_type: 'video_upload',
          p_event_data: {
            video_id: videoId,
            pedido_id: pedidoId,
            timestamp: new Date().toISOString(),
          },
        });
        
        console.log('✅ Video upload tracked:', videoId);
      } catch (error) {
        console.error('❌ Error tracking video upload:', error);
      }
    },
    [userProfile?.id]
  );

  const trackVideoSwap = useCallback(
    async (oldVideoId: string, newVideoId: string, pedidoId: string) => {
      if (!userProfile?.id) return;

      try {
        await supabase.rpc('log_client_activity', {
          p_user_id: userProfile.id,
          p_event_type: 'video_swap',
          p_event_data: {
            old_video_id: oldVideoId,
            new_video_id: newVideoId,
            pedido_id: pedidoId,
            timestamp: new Date().toISOString(),
          },
        });
        
        console.log('✅ Video swap tracked:', oldVideoId, '->', newVideoId);
      } catch (error) {
        console.error('❌ Error tracking video swap:', error);
      }
    },
    [userProfile?.id]
  );

  const trackVideoView = useCallback(
    async (videoId: string) => {
      if (!userProfile?.id) return;

      try {
        await supabase.rpc('log_client_activity', {
          p_user_id: userProfile.id,
          p_event_type: 'video_view',
          p_event_data: {
            video_id: videoId,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error('❌ Error tracking video view:', error);
      }
    },
    [userProfile?.id]
  );

  return {
    trackVideoUpload,
    trackVideoSwap,
    trackVideoView,
  };
};
