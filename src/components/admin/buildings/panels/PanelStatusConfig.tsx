
import React from 'react';
import { Wifi, WifiOff, Settings, Monitor } from 'lucide-react';

export interface StatusConfig {
  badge: string;
  icon: React.ReactNode;
  label: string;
  bgGradient: string;
  borderColor: string;
}

export const getPanelStatusConfig = (status: string): StatusConfig => {
  switch (status) {
    case 'online':
      return {
        badge: 'bg-green-500 text-white',
        icon: <Wifi className="h-4 w-4" />,
        label: 'Online',
        bgGradient: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-200'
      };
    case 'offline':
      return {
        badge: 'bg-red-500 text-white',
        icon: <WifiOff className="h-4 w-4" />,
        label: 'Offline',
        bgGradient: 'from-red-50 to-rose-50',
        borderColor: 'border-red-200'
      };
    case 'maintenance':
      return {
        badge: 'bg-yellow-500 text-white',
        icon: <Settings className="h-4 w-4" />,
        label: 'Manutenção',
        bgGradient: 'from-yellow-50 to-amber-50',
        borderColor: 'border-yellow-200'
      };
    default:
      return {
        badge: 'bg-gray-500 text-white',
        icon: <Monitor className="h-4 w-4" />,
        label: 'Desconhecido',
        bgGradient: 'from-gray-50 to-slate-50',
        borderColor: 'border-gray-200'
      };
  }
};

export const formatLastSync = (dateString?: string): string => {
  if (!dateString) return 'Nunca';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return `${diffDays}d atrás`;
};
