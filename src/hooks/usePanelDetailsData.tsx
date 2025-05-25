
import { useState } from 'react';
import { toast } from 'sonner';

export const usePanelDetailsData = (panel?: any) => {
  const [showPassword, setShowPassword] = useState(false);

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { variant: any, label: string, icon: any, color: string }> = {
      online: { variant: 'success', label: 'Online', icon: 'Wifi', color: 'text-green-600' },
      offline: { variant: 'destructive', label: 'Offline', icon: 'WifiOff', color: 'text-red-600' },
      maintenance: { variant: 'secondary', label: 'Manutenção', icon: 'Settings', color: 'text-orange-500' }
    };
    return statusMap[status] || statusMap.offline;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência`);
  };

  return {
    showPassword,
    setShowPassword,
    getStatusInfo,
    copyToClipboard
  };
};
