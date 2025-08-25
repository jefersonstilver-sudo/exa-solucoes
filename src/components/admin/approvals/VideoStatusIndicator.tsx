import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Clock, 
  Home, 
  Pause, 
  Ban, 
  Calendar,
  Shield,
  AlertCircle 
} from 'lucide-react';

interface VideoStatusIndicatorProps {
  status: {
    primary_status: string;
    is_displaying: boolean;
    is_base_video: boolean;
    is_scheduled: boolean;
    schedule_active_now: boolean;
    is_blocked: boolean;
    is_active: boolean;
  };
}

const VideoStatusIndicator: React.FC<VideoStatusIndicatorProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status.primary_status) {
      case 'displaying':
        return {
          icon: Play,
          label: 'EM EXIBIÇÃO',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
          description: 'Vídeo sendo exibido agora'
        };
      case 'scheduled_active':
        return {
          icon: Calendar,
          label: 'AGENDADO ATIVO',
          variant: 'default' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          description: 'Vídeo em horário de agendamento'
        };
      case 'scheduled_inactive':
        return {
          icon: Clock,
          label: 'AGENDADO',
          variant: 'outline' as const,
          className: 'bg-blue-50 text-blue-600 border-blue-200',
          description: 'Vídeo com agendamento fora do horário'
        };
      case 'base':
        return {
          icon: Home,
          label: 'BASE',
          variant: 'default' as const,
          className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          description: 'Vídeo padrão do pedido'
        };
      case 'blocked':
        return {
          icon: Ban,
          label: 'BLOQUEADO',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
          description: 'Vídeo bloqueado administrativamente'
        };
      default:
        return {
          icon: Pause,
          label: 'STANDBY',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-600 border-gray-200',
          description: 'Aprovado mas inativo'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className="flex flex-col gap-1">
      <Badge 
        variant={config.variant}
        className={`${config.className} flex items-center gap-1 text-xs font-medium px-2 py-1`}
      >
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
      
      <span className="text-xs text-muted-foreground">
        {config.description}
      </span>
      
      {/* Additional status indicators */}
      <div className="flex flex-wrap gap-1 mt-1">
        {status.is_base_video && status.primary_status !== 'base' && (
          <Badge variant="outline" className="text-xs px-1 py-0">
            <Home className="h-2 w-2 mr-1" />
            Base
          </Badge>
        )}
        
        {status.is_scheduled && (
          <Badge variant="outline" className="text-xs px-1 py-0">
            <Calendar className="h-2 w-2 mr-1" />
            Agendado
          </Badge>
        )}
        
        {!status.is_active && (
          <Badge variant="outline" className="text-xs px-1 py-0 text-orange-600 border-orange-200">
            <AlertCircle className="h-2 w-2 mr-1" />
            Inativo
          </Badge>
        )}
      </div>
    </div>
  );
};

export default VideoStatusIndicator;