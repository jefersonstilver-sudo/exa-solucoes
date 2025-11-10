import React from 'react';
import { Bell, X, Check, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { cn } from '@/lib/utils';

export const RealtimeOrderNotification: React.FC = () => {
  const { notifications, unreadCount, markAsSeen, markAllAsSeen, clearNotifications } = useOrderNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative"
        >
          <Bell className={cn(
            "h-5 w-5",
            unreadCount > 0 && "animate-pulse text-green-600"
          )} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-green-600 text-white"
              variant="default"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Novos Pedidos</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {unreadCount} novo{unreadCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsSeen}
                  className="h-8 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Marcar todos
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearNotifications}
                  className="h-8 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              </>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nenhuma notificação recente</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-accent transition-colors cursor-pointer",
                    !notification.seen && "bg-green-50"
                  )}
                  onClick={() => markAsSeen(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      notification.seen ? "bg-gray-300" : "bg-green-500"
                    )} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">
                            {notification.client_name || notification.client_email || 'Cliente'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-bold text-green-600">
                              {formatCurrency(notification.valor_total)}
                            </span>
                          </div>
                        </div>
                        {!notification.seen && (
                          <Badge className="bg-green-600 text-white text-xs">
                            Novo
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground">
              Últimas {notifications.length} notificações
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
