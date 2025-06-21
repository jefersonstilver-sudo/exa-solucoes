
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldCheck, ShieldX, Clock, Play } from 'lucide-react';
import { getOrderSecurityStatus } from '@/services/videoUploadSecurityService';

interface OrderSecurityBannerProps {
  orderStatus: string;
  className?: string;
}

export const OrderSecurityBanner: React.FC<OrderSecurityBannerProps> = ({ 
  orderStatus, 
  className = "" 
}) => {
  const security = getOrderSecurityStatus(orderStatus);
  
  const getIcon = () => {
    switch (security.level) {
      case 'blocked':
        return <ShieldX className="h-5 w-5 text-red-500" />;
      case 'allowed':
        return <ShieldCheck className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Play className="h-5 w-5 text-blue-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getVariant = () => {
    switch (security.level) {
      case 'blocked':
        return 'destructive';
      case 'allowed':
        return 'default';
      case 'active':
        return 'default';
      default:
        return 'default';
    }
  };

  const getBgColor = () => {
    switch (security.level) {
      case 'blocked':
        return 'bg-red-50 border-red-200';
      case 'allowed':
        return 'bg-green-50 border-green-200';
      case 'active':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Alert variant={getVariant()} className={`${getBgColor()} ${className}`}>
      <div className="flex items-center space-x-3">
        {getIcon()}
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{security.message}</span>
            <span className="text-xs px-2 py-1 rounded bg-white/50">
              {orderStatus.toUpperCase()}
            </span>
          </div>
          <AlertDescription className="mt-1">
            {security.description}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
