
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

  // Determinar cor do card baseado na atribuição
  const getCardBackground = () => {
    if (panel.building_id) {
      // Painel atribuído - verde claro
      return 'bg-green-50 border-green-200 hover:bg-green-100';
    } else {
      // Painel não atribuído - amarelo claro
      return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
    }
  };

  const statusInfo = getStatusInfo(panel.status);
  const StatusIcon = statusInfo.icon;
  const OrientationIcon = getOrientationIcon('vertical'); // Padronizado para vertical

  // Especificações padronizadas
  const standardSpecs = {
    resolucao: '1080x1920',
    orientacao: 'vertical',
    sistema_operacional: 'linux'
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${getCardBackground()}`}>
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
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <OrientationIcon className="h-3 w-3" />
                  Vertical
                </Badge>
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
          {/* Status de Atribuição */}
          <div className="mb-3">
            {panel.building_id ? (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                Atribuído ao prédio
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                Disponível para atribuição
              </Badge>
            )}
          </div>

          {/* Especificações Técnicas Padronizadas */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Resolução:</span>
              <span className="ml-1 font-medium">{standardSpecs.resolucao}</span>
            </div>
            <div>
              <span className="text-gray-500">Orientação:</span>
              <span className="ml-1 font-medium capitalize">{standardSpecs.orientacao}</span>
            </div>
            <div>
              <span className="text-gray-500">Sistema:</span>
              <span className="ml-1 font-medium capitalize">{standardSpecs.sistema_operacional}</span>
            </div>
            {panel.modelo && (
              <div>
                <span className="text-gray-500">Modelo:</span>
                <span className="ml-1 font-medium">{panel.modelo}</span>
              </div>
            )}
          </div>

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
