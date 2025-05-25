
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MonitorPlay, 
  Wifi, 
  WifiOff, 
  Settings, 
  Eye, 
  Pencil,
  Trash2,
  MapPin,
  Monitor,
  Smartphone,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PanelConfigCardProps {
  panel: any;
  onView: (panel: any) => void;
  onEdit: (panel: any) => void;
  onDelete: (panel: any) => void;
}

const PanelConfigCard: React.FC<PanelConfigCardProps> = ({
  panel,
  onView,
  onEdit,
  onDelete
}) => {
  // Debug logging for panel data
  console.log('🎯 [PANEL CARD] Renderizando painel:', {
    code: panel.code,
    polegada: panel.polegada,
    resolucao: panel.resolucao,
    orientacao: panel.orientacao,
    sistema_operacional: panel.sistema_operacional
  });

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { variant: any, label: string, icon: any, color: string }> = {
      online: { variant: 'success', label: 'Online', icon: Wifi, color: 'text-green-600' },
      offline: { variant: 'destructive', label: 'Offline', icon: WifiOff, color: 'text-red-600' },
      maintenance: { variant: 'secondary', label: 'Manutenção', icon: Settings, color: 'text-orange-500' }
    };
    return statusMap[status] || statusMap.offline;
  };

  const getOrientationIcon = (orientacao: string) => {
    return orientacao === 'vertical' ? Smartphone : Monitor;
  };

  const statusInfo = getStatusInfo(panel.status);
  const StatusIcon = statusInfo.icon;
  const OrientationIcon = getOrientationIcon(panel.orientacao);

  return (
    <Card className={`
      hover:shadow-lg transition-shadow border border-gray-200
    `}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indexa-purple/10 rounded-lg flex items-center justify-center">
              <MonitorPlay className="h-6 w-6 text-indexa-purple" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{panel.code}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={statusInfo.variant} className="text-xs flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </Badge>
                {panel.orientacao && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <OrientationIcon className="h-3 w-3" />
                    {panel.orientacao === 'vertical' ? 'Vertical' : 'Horizontal'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(panel)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(panel)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(panel)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          {/* Informações Técnicas com Debug */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {panel.polegada && (
              <div>
                <span className="text-gray-500">Tamanho:</span>
                <span className="ml-1 font-medium">{panel.polegada}"</span>
                {panel.polegada !== '22' && (
                  <span className="ml-1 text-red-500 text-xs">[DEBUG: ≠22]</span>
                )}
              </div>
            )}
            {panel.resolucao && (
              <div>
                <span className="text-gray-500">Resolução:</span>
                <span className="ml-1 font-medium">{panel.resolucao}</span>
                {panel.resolucao !== '1080x1920' && (
                  <span className="ml-1 text-red-500 text-xs">[DEBUG: ≠1080x1920]</span>
                )}
              </div>
            )}
            {panel.sistema_operacional && (
              <div>
                <span className="text-gray-500">SO:</span>
                <span className="ml-1 font-medium capitalize">{panel.sistema_operacional}</span>
                {panel.sistema_operacional !== 'linux' && (
                  <span className="ml-1 text-red-500 text-xs">[DEBUG: ≠linux]</span>
                )}
              </div>
            )}
          </div>

          {/* Debug info for orientation */}
          {panel.orientacao !== 'vertical' && (
            <div className="text-xs text-red-500 bg-red-50 p-1 rounded">
              DEBUG: Orientação = {panel.orientacao} (deveria ser vertical)
            </div>
          )}

          {/* Localização e Prédio */}
          <div className="space-y-1">
            {panel.buildings?.nome && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{panel.buildings.nome}</span>
              </div>
            )}
            {panel.localizacao && (
              <div className="text-xs text-gray-500">
                📍 {panel.localizacao}
              </div>
            )}
          </div>

          {/* Acesso Remoto */}
          {panel.codigo_anydesk && (
            <div className="p-2 bg-gray-50 rounded text-xs">
              <span className="text-gray-500">AnyDesk:</span>
              <span className="ml-1 font-mono">{panel.codigo_anydesk}</span>
            </div>
          )}

          {/* Última Sincronização */}
          {panel.ultima_sync && (
            <div className="text-xs text-gray-400">
              Última sync: {new Date(panel.ultima_sync).toLocaleString('pt-BR')}
            </div>
          )}

          {/* Ações Rápidas */}
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(panel)}
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(panel)}
              className="flex-1"
            >
              <Pencil className="h-3 w-3 mr-1" />
              Editar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PanelConfigCard;
