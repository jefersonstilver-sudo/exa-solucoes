
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveAuth } from '@/hooks/useEffectiveAuth';
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
  // usuário EFETIVO: no "Acessar como cliente" o sininho é o do cliente, não o de quem está vendo
  const { userProfile, isImpersonating } = useEffectiveAuth() as any;

  const fetchNotifications = async () => {
    if (!userProfile?.id) return;

    try {
      const [lista, naoLidas] = await Promise.all([
        supabase.from('notifications').select('*').eq('user_id', userProfile.id).order('created_at', { ascending: false }).limit(30),
        // número real de não lidas (antes contava só dentro das 50 carregadas → aparecia sempre "50")
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userProfile.id).eq('is_read', false),
      ]);
      if (lista.error) throw lista.error;

      setNotifications(lista.data || []);
      setUnreadCount(naoLidas.count ?? (lista.data || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (isImpersonating) return; // vendo como cliente: só olha, não marca nada como lido por ele
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
    if (!userProfile?.id || isImpersonating) return;

    try {
      // todas as não lidas de uma vez (não só as que estão na lista)
      const { error } = await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() } as any).eq('user_id', userProfile.id).eq('is_read', false);
      if (error) {
        for (const id of notifications.filter(n => !n.is_read).map(n => n.id)) await markAsRead(id);
        return;
      }
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
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
