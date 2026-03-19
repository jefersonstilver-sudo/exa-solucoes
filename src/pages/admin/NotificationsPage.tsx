
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Filter, 
  Calendar,
  Eye,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { cn } from '@/lib/utils';

const FILTER_OPTIONS = [
  { key: 'all', label: 'Todas' },
  { key: 'unread', label: 'Não lidas' },
  { key: 'read', label: 'Lidas' },
  { key: 'sales', label: 'Vendas' },
] as const;

const NotificationsPage = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const { isMobile } = useAdvancedResponsive();

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'read') return notification.is_read;
    if (filter === 'sales') return notification.type === 'sale';
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}min atrás`;
    return 'Agora';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
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
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.type === 'sale' && notification.metadata?.pedido_id) {
      navigate(`/super_admin/pedidos/${notification.metadata.pedido_id}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Bell className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground">Carregando notificações...</h2>
          </div>
        </div>
      </div>
    );
  }

  // ── Mobile Layout ──
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-background">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 safe-area-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">Notificações</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={markAllAsRead}
                className="h-9 w-9"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="h-5 w-5 text-primary" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 border-b border-border no-scrollbar">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0",
                "touch-manipulation",
                filter === opt.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {opt.label}
              {opt.key === 'unread' && unreadCount > 0 && (
                <span className="ml-1 text-xs opacity-80">({unreadCount})</span>
              )}
            </button>
          ))}
        </div>

        {/* Mobile Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                Nenhuma notificação
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                {filter === 'unread' 
                  ? 'Todas as notificações foram lidas!'
                  : 'Você não tem notificações no momento.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 active:bg-accent/50 transition-colors cursor-pointer touch-manipulation",
                    !notification.is_read && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Icon */}
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-sm leading-tight",
                        !notification.is_read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                      )}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>

                  {/* Read indicator / action */}
                  <div className="flex-shrink-0 mt-1">
                    {!notification.is_read ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent touch-manipulation"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      </button>
                    ) : (
                      <div className="w-8 h-8 flex items-center justify-center">
                        <Check className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Desktop Layout (original) ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notificações</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 
              ? `${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
              : 'Todas as notificações estão em dia'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <Button 
              onClick={markAllAsRead}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar: {FILTER_OPTIONS.find(o => o.key === filter)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {FILTER_OPTIONS.map((opt) => (
                <DropdownMenuItem key={opt.key} onClick={() => setFilter(opt.key)}>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">
            Lista de Notificações ({filteredNotifications.length})
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Gerencie suas notificações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhuma notificação encontrada
              </h3>
              <p className="text-muted-foreground">
                {filter === 'unread' 
                  ? 'Todas as notificações estão marcadas como lidas'
                  : 'Não há notificações para exibir'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors",
                    !notification.is_read 
                      ? 'border-l-4 border-l-primary bg-primary/5' 
                      : 'border-border'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <span className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className={cn(
                            "font-medium",
                            !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <Badge variant="secondary" className="bg-primary text-primary-foreground">
                              Nova
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
