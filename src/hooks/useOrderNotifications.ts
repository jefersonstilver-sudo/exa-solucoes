import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NewOrderNotification {
  id: string;
  created_at: string;
  valor_total: number;
  client_name?: string;
  client_email?: string;
  seen: boolean;
}

export const useOrderNotifications = () => {
  const [notifications, setNotifications] = useState<NewOrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastNotificationRef = useRef<string | null>(null);

  // Initialize notification sound
  useEffect(() => {
    // Create a simple notification beep using Web Audio API
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyAzPLZiTYIGGe77eeeTRALUKvj8LZjHAU5kdXzzHkrBSR3yPDckD8KFWO08+qoVBMKRp/g8r9rIQUsgszy2Ik2CBhnvO3nn0wQC1Cr4/C1Yh0FO5PU8sx5LQYleMjw3ZA/ChVitPPqqVQTCkef4PK/ayEFLILM8tmJNQgYZ7zt559NEAtRquPwtmIcBTyS1fLLeSsFJXjJ8NyQPwoWYrPz6qlUEwpHn+Dyv2shBSyCzPLZiTUIGGe87eefTRALUarj8LViHAU8ktXyy3krBSR4yfDckEAKFWGz8+qpVBMKR5/g8r9rIQUsgsrz24k1CBhnu+3mnkwQC1Cq4/C2Yh0FO5LV8st5KwUkeMnw3JA/ChVhs/PqqVQTCkeg3/K/ayEFLIHL8tiINQgYZ7vt5p5MEAtPquPwtWIcBT2S1PLLeSsFJHfJ8NyQQAoVYbPz6qlUEwpHn+Dyv2shBSyCy/LYiDUIGGe77eaeTBALT6rj8LViHAU9ktTyy3krBSR3yfDckEAKFWGz8+qpVBMKR5/g8r9rIQUsgsvy2Ig1CBhnu+3mnkwQC0+q4/C1YhwFPZLU8st5KwUkd8nw3JBAChVhs/PqqVQTCkef4PK/ayEFLILL8tiINQgYZ7vt5p5MEAtPquPwtWIcBT2S1PLLeSsFJHfJ8NyQQAoVYbPz6qlUEwpHn+Dyv2shBSyCy/LYiDUIGGe77eaeTBALT6rj8LViHAU9ktTyy3krBSR3yfDckEAKFWGz8+qpVBMKR5/g8r9rIQUsgsvy2Ig1CBhnu+3mnkwQC0+q4/C1YhwFPZLU8st5KwUkd8nw3JBAChVhs/PqqVQTCkef4PK/ayEFLILL8tiINQgYZ7vt5p5MEAtPquPwtWIcBT2S1PLLeSsFJHfJ8NyQQAoVYbPz6qlUEwpHn+Dyv2shBSyCy/LYiDUIGGe77eaeTBALT6rj8LViHAU9ktTyy3krBSR3yfDckEAKFWGz8+qpVBMKR5/g8r9rIQUsgsvy2Ig1CBhnu+3mnkwQC0+q4/C1YhwFPZLU8st5KwUkd8nw3JBAChVhs/PqqVQTCkef4PK/ayEFLILL8tiINQgYZ7vt5p5MEAtPquPwtWIcBT2S1PLLeSsFJHfJ8NyQQAoVYbPz6qlUEwpHn+Dyv2shBSyCy/LYiDUIGGe77eaeTBALT6rj8LViHAU9ktTyy3krBSR3yfDckEAKFWGz8+qpVBMKR5/g8r9rIQUsgsvy2Ig1CBhnu+3mnkwQC0+q4/C1YhwFPZLU8st5KwUkd8nw3JBAChVhs/PqqVQTCkef4PK/ayEFLILL8tiINQgYZ7vt5p5MEAtPquPwtWIcBT2S1PLLeSsFJHfJ8NyQQAoVYbPz6qlUEwpHn+Dyv2shBSyCy/LYiDUIGGe77eaeTBALT6rj8LViHAU9ktTyy3krBSR3yfDckD8KFWGz8+qpVBMKR5/g8r9rIQUsgsvy2Ig1CBhnu+3mnkwQC0+q4/C1YhwFPZLU8st5KwUkd8nw3I8/ChVhs/PqqVQTCkef4PK/ayEFLILL8tiINQgYZ7vt5p5MEAtPquPwtWIcBT2S1PLLeSsFJHfJ8NyPPwoVYbPz6qlUEwpHn+Dyv2shBSyCy/LYiDUIGGe77eaeTBALT6rj8LViHAU9ktTyy3krBSR3yfDcjz8KFWGz8+qpVBMKR5/g8r9rIQUsgsvy2Ig1CBhnu+3mnkwQC0+q4/C1YhwFPZLU8st5KwUkd8nw3I8/ChVhs/PqqVQTCkef4PK/ayEFLILL8tiINQgYZ7vt5p5MEAtPquPwtWIcBT2S1PLLeSsFJHfJ8NyPPw==');
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('Could not play notification sound:', err));
    }
  }, []);

  // Add a new notification
  const addNotification = useCallback((order: NewOrderNotification) => {
    // Avoid duplicate notifications
    if (lastNotificationRef.current === order.id) {
      return;
    }
    
    lastNotificationRef.current = order.id;

    setNotifications(prev => {
      const exists = prev.some(n => n.id === order.id);
      if (exists) return prev;
      
      return [{ ...order, seen: false }, ...prev].slice(0, 10); // Keep only last 10
    });

    setUnreadCount(prev => prev + 1);

    // Show toast notification
    const clientInfo = order.client_name || order.client_email || 'Cliente';
    toast.success(`💰 Novo pedido pago!`, {
      description: `${clientInfo} - R$ ${(order.valor_total / 100).toFixed(2)}`,
      duration: 5000,
    });

    // Play sound
    playNotificationSound();
  }, [playNotificationSound]);

  // Mark a notification as seen
  const markAsSeen = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, seen: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as seen
  const markAllAsSeen = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
    setUnreadCount(0);
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    lastNotificationRef.current = null;
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    console.log('🔔 Setting up order notifications listener...');

    const channel = supabase
      .channel('order-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
          filter: 'status=eq.pago'
        },
        (payload) => {
          console.log('🆕 New paid order detected:', payload);
          const newOrder = payload.new as any;
          addNotification({
            id: newOrder.id,
            created_at: newOrder.created_at,
            valor_total: newOrder.valor_total,
            client_name: newOrder.client_name,
            client_email: newOrder.client_email,
            seen: false
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: 'status=eq.pago'
        },
        (payload) => {
          const oldRecord = payload.old as any;
          const newRecord = payload.new as any;
          
          // Only notify if status changed to 'pago'
          if (oldRecord.status !== 'pago' && newRecord.status === 'pago') {
            console.log('✅ Order payment confirmed:', payload);
            addNotification({
              id: newRecord.id,
              created_at: newRecord.created_at,
              valor_total: newRecord.valor_total,
              client_name: newRecord.client_name,
              client_email: newRecord.client_email,
              seen: false
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Cleaning up order notifications listener');
      supabase.removeChannel(channel);
    };
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    markAsSeen,
    markAllAsSeen,
    clearNotifications
  };
};
