import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Monitor, 
  Wifi, 
  WifiOff, 
  Settings, 
  Trash2, 
  RefreshCw,
  Clock,
  Eye
} from 'lucide-react';
import { AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PanelCardProps {
  panel: {
    id: string;
    code: string;
    status: string;
    resolucao?: string;
    modo?: string;
    ultima_sync?: string;
  };
  onRemove: (panel: any) => void;
  onSync: (panelId: string) => void;
  onViewDetails: (panelId: string) => void;
  canManage?: boolean;
  disabled?: boolean; // Added disabled prop
}

const PanelCard: React.FC<PanelCardProps> = ({
  panel,
  onRemove,
  onSync,
  onViewDetails,
  canManage = true,
  disabled = false // Added disabled prop with default value
}) => {
  console.log('🎯 [PANEL CARD] Renderizando painel:', {
    id: panel.id,
    code: panel.code,
    status: panel.status,
    disabled
  });

  const getStatusConfig = (status: string) => {
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

  const statusConfig = getStatusConfig(panel.status);

  const formatLastSync = (dateString?: string) => {
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

  const handleRemove = () => {
    if (disabled) return; // Prevent action if disabled
    console.log('🗑️ [PANEL CARD] Iniciando remoção:', panel);
    onRemove(panel);
  };

  const handleSync = () => {
    if (disabled) return; // Prevent action if disabled
    onSync(panel.id);
  };

  const handleViewDetails = () => {
    if (disabled) return; // Prevent action if disabled
    onViewDetails(panel.id);
  };

  return (
    <Card className={`
      hover:shadow-lg transition-all duration-300 hover:scale-[1.02]
      bg-gradient-to-br ${statusConfig.bgGradient}
      border-2 ${statusConfig.borderColor}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center space-x-2">
            {statusConfig.icon}
            <span>{panel.code}</span>
          </CardTitle>
          <Badge className={`${statusConfig.badge} shadow-md`}>
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informações Técnicas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 p-3 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Resolução</div>
            <div className="font-medium text-sm">
              {panel.resolucao || 'N/A'}
            </div>
          </div>
          <div className="bg-white/60 p-3 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Modo</div>
            <div className="font-medium text-sm">
              {panel.modo || 'N/A'}
            </div>
          </div>
        </div>

        {/* Última Sincronização */}
        <div className="bg-white/60 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="h-3 w-3 text-gray-600" />
            <span className="text-xs text-gray-600">Última Sincronização</span>
          </div>
          <div className="font-medium text-sm">
            {formatLastSync(panel.ultima_sync)}
          </div>
        </div>

        {/* Ações */}
        {canManage && (
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewDetails}
              disabled={disabled}
              className="flex-1 bg-white/80 hover:bg-white"
            >
              <Eye className="h-3 w-3 mr-1" />
              Detalhes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={disabled}
              className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRemove}
              disabled={disabled}
              className="bg-red-500 text-white hover:bg-red-600 border-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PanelCard;
