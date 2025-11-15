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
  const lastNotificationRef = useRef<string | null>(null);

  // Play notification sound with settings
  const playNotificationSound = useCallback(() => {
    try {
      const settings = JSON.parse(
        localStorage.getItem('orderNotificationSound') || '{"enabled":true,"volume":80}'
      );
      
      if (!settings.enabled) {
        return; // Sound is disabled
      }

      // Create AudioContext for cash register sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;
      
      // Master gain for volume control
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(settings.volume / 100, now);
      masterGain.connect(audioContext.destination);

      // Bell sound (ding!)
      const bellOsc = audioContext.createOscillator();
      const bellGain = audioContext.createGain();
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(1200, now);
      bellOsc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
      bellGain.gain.setValueAtTime(0.3, now);
      bellGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      bellOsc.connect(bellGain);
      bellGain.connect(masterGain);
      bellOsc.start(now);
      bellOsc.stop(now + 0.15);

      // Drawer sound
      const drawerOsc = audioContext.createOscillator();
      const drawerGain = audioContext.createGain();
      drawerOsc.type = 'sawtooth';
      drawerOsc.frequency.setValueAtTime(200, now + 0.1);
      drawerOsc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
      drawerGain.gain.setValueAtTime(0, now + 0.1);
      drawerGain.gain.linearRampToValueAtTime(0.15, now + 0.15);
      drawerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      drawerOsc.connect(drawerGain);
      drawerGain.connect(masterGain);
      drawerOsc.start(now + 0.1);
      drawerOsc.stop(now + 0.35);

      // Coin sound
      const coinOsc = audioContext.createOscillator();
      const coinGain = audioContext.createGain();
      coinOsc.type = 'square';
      coinOsc.frequency.setValueAtTime(800, now + 0.15);
      coinOsc.frequency.exponentialRampToValueAtTime(400, now + 0.25);
      coinGain.gain.setValueAtTime(0.2, now + 0.15);
      coinGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      coinOsc.connect(coinGain);
      coinGain.connect(masterGain);
      coinOsc.start(now + 0.15);
      coinOsc.stop(now + 0.25);
    } catch (err) {
      console.error('Could not play notification sound:', err);
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
