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

  // Play notification sound with settings from localStorage
  const playNotificationSound = useCallback(() => {
    try {
      const settings = JSON.parse(
        localStorage.getItem('orderNotificationSound') || '{"enabled":true,"volume":80,"soundType":"cha-ching"}'
      );
      
      if (!settings.enabled) {
        return;
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(settings.volume / 100, now);
      masterGain.connect(audioContext.destination);

      const soundType = settings.soundType || 'cha-ching';

      // Helper functions for each sound type
      const playCashRegister = () => {
        const bell = audioContext.createOscillator();
        const bellGain = audioContext.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(1400, now);
        bell.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        bellGain.gain.setValueAtTime(0.4, now);
        bellGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        bell.connect(bellGain).connect(masterGain);
        bell.start(now);
        bell.stop(now + 0.2);

        const drawer = audioContext.createOscillator();
        const drawerGain = audioContext.createGain();
        drawer.type = 'sawtooth';
        drawer.frequency.setValueAtTime(180, now + 0.15);
        drawer.frequency.exponentialRampToValueAtTime(60, now + 0.4);
        drawerGain.gain.setValueAtTime(0, now + 0.15);
        drawerGain.gain.linearRampToValueAtTime(0.2, now + 0.2);
        drawerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        drawer.connect(drawerGain).connect(masterGain);
        drawer.start(now + 0.15);
        drawer.stop(now + 0.45);
      };

      const playChaChing = () => {
        const cha = audioContext.createOscillator();
        const chaGain = audioContext.createGain();
        cha.type = 'sine';
        cha.frequency.setValueAtTime(600, now);
        cha.frequency.exponentialRampToValueAtTime(1000, now + 0.08);
        chaGain.gain.setValueAtTime(0.3, now);
        chaGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        cha.connect(chaGain).connect(masterGain);
        cha.start(now);
        cha.stop(now + 0.12);

        const ching = audioContext.createOscillator();
        const chingGain = audioContext.createGain();
        ching.type = 'sine';
        ching.frequency.setValueAtTime(1600, now + 0.1);
        ching.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
        chingGain.gain.setValueAtTime(0.4, now + 0.1);
        chingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        ching.connect(chingGain).connect(masterGain);
        ching.start(now + 0.1);
        ching.stop(now + 0.3);

        const res = audioContext.createOscillator();
        const resGain = audioContext.createGain();
        res.type = 'sine';
        res.frequency.setValueAtTime(800, now + 0.15);
        resGain.gain.setValueAtTime(0.15, now + 0.15);
        resGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        res.connect(resGain).connect(masterGain);
        res.start(now + 0.15);
        res.stop(now + 0.4);
      };

      const playCoinsDrop = () => {
        [0, 0.05, 0.09, 0.14, 0.18, 0.23, 0.27].forEach((time, i) => {
          const coin = audioContext.createOscillator();
          const coinGain = audioContext.createGain();
          const freq = 900 - i * 50;
          coin.type = 'sine';
          coin.frequency.setValueAtTime(freq, now + time);
          coin.frequency.exponentialRampToValueAtTime(freq * 0.8, now + time + 0.05);
          coinGain.gain.setValueAtTime(0.25, now + time);
          coinGain.gain.exponentialRampToValueAtTime(0.01, now + time + 0.08);
          coin.connect(coinGain).connect(masterGain);
          coin.start(now + time);
          coin.stop(now + time + 0.08);
        });
      };

      const playMoneyCount = () => {
        [0, 0.08, 0.16, 0.24].forEach((time, i) => {
          const snap = audioContext.createOscillator();
          const snapGain = audioContext.createGain();
          snap.type = 'square';
          snap.frequency.setValueAtTime(200 + i * 50, now + time);
          snap.frequency.exponentialRampToValueAtTime(100, now + time + 0.03);
          snapGain.gain.setValueAtTime(0.2, now + time);
          snapGain.gain.exponentialRampToValueAtTime(0.01, now + time + 0.04);
          snap.connect(snapGain).connect(masterGain);
          snap.start(now + time);
          snap.stop(now + time + 0.04);
        });
      };

      const playCoinInsert = () => {
        const insert = audioContext.createOscillator();
        const insertGain = audioContext.createGain();
        insert.type = 'sine';
        insert.frequency.setValueAtTime(1200, now);
        insert.frequency.exponentialRampToValueAtTime(400, now + 0.15);
        insertGain.gain.setValueAtTime(0.3, now);
        insertGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        insert.connect(insertGain).connect(masterGain);
        insert.start(now);
        insert.stop(now + 0.2);

        const clink = audioContext.createOscillator();
        const clinkGain = audioContext.createGain();
        clink.type = 'sine';
        clink.frequency.setValueAtTime(800, now + 0.2);
        clinkGain.gain.setValueAtTime(0.25, now + 0.2);
        clinkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        clink.connect(clinkGain).connect(masterGain);
        clink.start(now + 0.2);
        clink.stop(now + 0.3);
      };

      // Play selected sound
      switch (soundType) {
        case 'cash-register':
          playCashRegister();
          break;
        case 'cha-ching':
          playChaChing();
          break;
        case 'coins-drop':
          playCoinsDrop();
          break;
        case 'money-count':
          playMoneyCount();
          break;
        case 'coin-insert':
          playCoinInsert();
          break;
        default:
          playChaChing();
      }
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
