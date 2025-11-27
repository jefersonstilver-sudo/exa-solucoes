import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Eye, MessageSquare, Activity, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationCenter = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { basePath } = useAdminBasePath();

  // Verificar se há notificações urgentes
  const hasUrgent = notifications.some(
    n => (n.type === 'benefit_choice_made' || n.type === 'crm_urgent' || n.type === 'panel_offline') && !n.is_read
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'crm_new_message':
      case 'crm_urgent':
        return <MessageSquare className="w-5 h-5 text-[#25D366]" />;
      case 'panel_offline':
      case 'panel_restored':
        return <Activity className="w-5 h-5 text-red-500" />;
      case 'benefit_choice_made':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'benefit_created':
      case 'benefit_code_sent':
        return <span className="text-xl">🎁</span>;
      case 'benefit_cancelled':
        return <span className="text-xl">❌</span>;
      case 'sale':
        return <span className="text-xl">💰</span>;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const getNotificationColor = (type: string) => {
    if (type === 'crm_urgent' || type === 'panel_offline') return 'bg-red-50 border-l-red-500';
    if (type === 'crm_new_message') return 'bg-green-50 border-l-green-500';
    if (type === 'panel_restored') return 'bg-blue-50 border-l-blue-500';
    if (type === 'benefit_choice_made') return 'bg-amber-50 border-l-amber-500';
    return 'bg-accent/50 border-l-primary';
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navegação baseada no tipo
    if (notification.type.startsWith('benefit_')) {
      navigate(`${basePath}/beneficio-prestadores`);
    } else if (notification.type.startsWith('crm_')) {
      navigate(`${basePath}/monitoramento-ia/conversas`);
    } else if (notification.type.startsWith('panel_')) {
      navigate(`${basePath}/monitoramento-ia/alertas`);
    } else if (notification.type === 'sale' && notification.metadata?.pedido_id) {
      navigate(`${basePath}/pedidos/${notification.metadata.pedido_id}`);
    }
    
    setIsOpen(false);
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative p-2 hover:bg-accent hover:text-accent-foreground transition-all duration-200 rounded-lg"
        >
          <Bell className={hasUrgent ? "h-5 w-5 animate-pulse text-red-500" : "h-5 w-5"} />
          {unreadCount > 0 && (
            <Badge 
              variant={hasUrgent ? "destructive" : "default"}
              className={`absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs shadow-lg ${
                hasUrgent ? 'animate-pulse' : ''
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[400px] p-0 rounded-2xl shadow-2xl border">
        {/* Header - Design moderno */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Notificações</h3>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo lido'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs h-8 hover:bg-primary/10"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-sm">Nenhuma notificação</p>
              <p className="text-xs text-muted-foreground mt-1">Você está em dia!</p>
            </div>
          ) : (
            <AnimatePresence>
              {recentNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 border-b last:border-b-0 hover:bg-accent/50 cursor-pointer transition-all duration-200 ${
                    !notification.is_read 
                      ? `${getNotificationColor(notification.type)} border-l-4` 
                      : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`text-sm font-semibold line-clamp-1 ${
                          !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {notification.message}
                      </p>

                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Marcar como lida
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 5 && (
          <div className="p-3 border-t bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              className="w-full hover:bg-primary/10"
              onClick={() => {
                navigate(`${basePath}/notificacoes`);
                setIsOpen(false);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver todas ({notifications.length})
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter;
