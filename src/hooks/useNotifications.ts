
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  const fetchNotifications = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        notification_id: notificationId
      });

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userProfile?.id) return;

    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      for (const id of unreadIds) {
        await markAsRead(id);
      }
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userProfile?.id]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userProfile?.id) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Toast para notificações importantes
          if (newNotification.type === 'video_approved') {
            toast.success(newNotification.title, {
              description: newNotification.message
            });
          } else if (newNotification.type === 'video_rejected') {
            toast.error(newNotification.title, {
              description: newNotification.message
            });
          } else if (newNotification.type === 'payment_confirmed') {
            toast.success(newNotification.title, {
              description: newNotification.message
            });
          } else if (newNotification.type === 'contract_expiring') {
            toast.warning(newNotification.title, {
              description: newNotification.message
            });
          } else if (newNotification.type === 'crm_new_message') {
            toast.info(newNotification.title, {
              description: newNotification.message
            });
          } else if (newNotification.type === 'crm_urgent') {
            toast.error(newNotification.title, {
              description: newNotification.message
            });
          } else if (newNotification.type === 'panel_offline') {
            toast.error(newNotification.title, {
              description: newNotification.message
            });
          } else if (newNotification.type === 'panel_restored') {
            toast.success(newNotification.title, {
              description: newNotification.message
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};
