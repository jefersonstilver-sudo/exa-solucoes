
import React from 'react';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  DollarSign, 
  Video,
  Calendar,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    metadata?: any;
  };
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onClose
}) => {
  const navigate = useNavigate();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'benefit_choice_made':
        return <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />;
      case 'benefit_created':
        return <span className="text-lg">🎁</span>;
      case 'benefit_code_sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'benefit_cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'video_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'video_rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'video_uploaded':
        return <Video className="h-4 w-4 text-blue-500" />;
      case 'payment_confirmed':
      case 'payment_received':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'contract_expiring':
      case 'contract_expiring_admin':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'sale':
        return <DollarSign className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'benefit_choice_made':
        return 'border-l-red-500 bg-red-50/80 border-2 border-red-200';
      case 'benefit_created':
        return 'border-l-blue-500 bg-blue-50/50';
      case 'benefit_code_sent':
        return 'border-l-green-500 bg-green-50/50';
      case 'benefit_cancelled':
        return 'border-l-gray-500 bg-gray-50/50';
      case 'video_approved':
      case 'payment_confirmed':
      case 'payment_received':
        return 'border-l-green-500 bg-green-50/50';
      case 'video_rejected':
        return 'border-l-red-500 bg-red-50/50';
      case 'video_uploaded':
        return 'border-l-blue-500 bg-blue-50/50';
      case 'contract_expiring':
      case 'contract_expiring_admin':
        return 'border-l-orange-500 bg-orange-50/50';
      case 'sale':
        return 'border-l-purple-500 bg-purple-50/50';
      default:
        return 'border-l-gray-500 bg-gray-50/50';
    }
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
    if (minutes > 0) return `${minutes}m atrás`;
    return 'Agora';
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }

    // Navegação baseada no tipo de notificação
    if (notification.type.startsWith('benefit_')) {
      navigate('/super_admin/beneficio-prestadores');
      onClose();
    } else if (notification.metadata?.pedido_id) {
      navigate(`/anunciante/pedido/${notification.metadata.pedido_id}`);
      onClose();
    }
  };

  return (
    <div
      className={cn(
        'p-3 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors',
        getNotificationColor(notification.type),
        !notification.is_read && 'bg-blue-50/30'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={cn(
                'text-sm font-medium',
                !notification.is_read && 'font-semibold'
              )}>
                {notification.title}
              </p>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 ml-2">
              {!notification.is_read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatTimeAgo(notification.created_at)}
              </span>
            </div>
          </div>
          
          {notification.metadata?.pedido_id && (
            <div className="mt-2">
              <Button variant="outline" size="sm" className="h-6 text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Ver Detalhes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
