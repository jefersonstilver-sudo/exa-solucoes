import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ZAPILog } from '../types/crmTypes';

interface UseRealtimeUpdatesProps {
  onNewMessage?: (message: ZAPILog) => void;
  onMessageUpdate?: (message: ZAPILog) => void;
  enabled?: boolean;
}

export const useRealtimeUpdates = ({
  onNewMessage,
  onMessageUpdate,
  enabled = true
}: UseRealtimeUpdatesProps) => {
  const notificationPermissionRef = useRef(false);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        notificationPermissionRef.current = permission === 'granted';
      });
    } else if ('Notification' in window) {
      notificationPermissionRef.current = Notification.permission === 'granted';
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('zapi_logs_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'zapi_logs'
        },
        (payload) => {
          const newMessage = payload.new as ZAPILog;
          console.log('Nova mensagem recebida:', newMessage);

          // Call callback
          if (onNewMessage) {
            onNewMessage(newMessage);
          }

          // Show desktop notification
          if (notificationPermissionRef.current && newMessage.direction === 'inbound') {
            new Notification('Nova mensagem Z-API', {
              body: `${newMessage.phone_number}: ${newMessage.message_text?.slice(0, 100)}`,
              icon: '/logo.png',
              tag: newMessage.id
            });
          }

          // Play sound (optional)
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(console.error);
          } catch (e) {
            console.log('Notification sound not available');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'zapi_logs'
        },
        (payload) => {
          const updatedMessage = payload.new as ZAPILog;
          if (onMessageUpdate) {
            onMessageUpdate(updatedMessage);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, onNewMessage, onMessageUpdate]);

  return { notificationEnabled: notificationPermissionRef.current };
};
