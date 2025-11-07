import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X, Eye, Calendar } from 'lucide-react';
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

const NotificationCenter = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { basePath } = useAdminBasePath();

  // Verificar se há notificações urgentes de benefício
  const hasUrgentBenefits = notifications.some(
    n => n.type === 'benefit_choice_made' && !n.is_read
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
      case 'benefit_choice_made':
        return '⚠️';
      case 'benefit_created':
        return '🎁';
      case 'benefit_code_sent':
        return '✅';
      case 'benefit_cancelled':
        return '❌';
      case 'sale':
        return '💰';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Marcar como lida se não estiver
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navegação baseada no tipo
    if (notification.type.startsWith('benefit_')) {
      navigate(`${basePath}/beneficio-prestadores`);
      setIsOpen(false);
    } else if (notification.type === 'sale' && notification.metadata?.pedido_id) {
      navigate(`${basePath}/pedidos/${notification.metadata.pedido_id}`);
      setIsOpen(false);
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative p-2 hover:bg-accent hover:text-accent-foreground transition-colors rounded-md"
        >
          <Bell className={hasUrgentBenefits ? "h-5 w-5 animate-pulse text-red-500" : "h-5 w-5"} />
          {unreadCount > 0 && (
            <Badge 
              variant={hasUrgentBenefits ? "destructive" : "default"}
              className={`absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs ${
                hasUrgentBenefits ? 'animate-pulse' : ''
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Carregando notificações...
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b hover:bg-accent cursor-pointer transition-colors ${
                  notification.type === 'benefit_choice_made' 
                    ? 'bg-red-50 border-l-4 border-l-red-500 animate-pulse' 
                    : !notification.is_read 
                    ? 'bg-accent/50 border-l-4 border-l-primary' 
                    : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${
                        !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>

                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 px-2 text-xs"
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
              </div>
            ))
          )}
        </div>

        {notifications.length > 5 && (
          <div className="p-3 border-t bg-muted/50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                navigate(`${basePath}/notificacoes`);
                setIsOpen(false);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver todas as notificações ({notifications.length})
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter;