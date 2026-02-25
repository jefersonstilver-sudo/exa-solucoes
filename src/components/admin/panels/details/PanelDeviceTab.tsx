import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Wifi, WifiOff, AlertTriangle, RefreshCw, Monitor, Globe, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PanelDeviceTabProps {
  panel: any;
}

const PanelDeviceTab: React.FC<PanelDeviceTabProps> = ({ panel }) => {
  // Buscar status do painel em tempo real
  const { data: deviceStatus, refetch, isLoading } = useQuery({
    queryKey: ['panel-device-status', panel.id],
    queryFn: async () => {
      // Status fetch - logging removed for performance
      
      const { data, error } = await supabase
        .from('paineis_status')
        .select('*')
        .eq('painel_id', panel.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar status:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos (was 10s)
  });

  // Determinar status de conexão
  const getConnectionStatus = () => {
    if (!deviceStatus?.ultimo_heartbeat) {
      return {
        status: 'offline',
        label: 'Nunca Conectado',
        icon: WifiOff,
        color: 'text-gray-500',
        variant: 'secondary' as const,
      };
    }

    const lastHeartbeat = new Date(deviceStatus.ultimo_heartbeat);
    const now = new Date();
    const diffSeconds = (now.getTime() - lastHeartbeat.getTime()) / 1000;

    if (deviceStatus.status === 'error' || deviceStatus.erro_ultimo) {
      return {
        status: 'error',
        label: 'Erro',
        icon: AlertTriangle,
        color: 'text-yellow-600',
        variant: 'destructive' as const,
      };
    }

    if (diffSeconds > 60) {
      return {
        status: 'offline',
        label: 'Desconectado',
        icon: WifiOff,
        color: 'text-red-600',
        variant: 'destructive' as const,
      };
    }

    return {
      status: 'online',
      label: 'Conectado',
      icon: Wifi,
      color: 'text-green-600',
      variant: 'default' as const,
    };
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon;

  // Endereço físico do prédio
  const enderecoFisico = panel.buildings
    ? `${panel.buildings.endereco}, ${panel.buildings.bairro}`
    : 'Prédio não vinculado';

  // Parse device info
  let deviceInfo: Record<string, any> = {};
  if (deviceStatus?.device_info) {
    try {
      deviceInfo = typeof deviceStatus.device_info === 'string' 
        ? JSON.parse(deviceStatus.device_info) 
        : deviceStatus.device_info;
    } catch (e) {
      console.error('Erro ao parsear device_info:', e);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Dispositivo Conectado
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Badge variant={connectionStatus.variant} className={`flex items-center gap-1 ${connectionStatus.status === 'online' ? 'bg-green-600 hover:bg-green-700' : ''}`}>
              <StatusIcon className="h-3 w-3" />
              {connectionStatus.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status de Conexão */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Status da Conexão
            </h4>
            <div className="p-3 bg-accent/50 rounded-lg">
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-5 w-5 ${connectionStatus.color}`} />
                <div>
                  <p className="font-semibold">{connectionStatus.label}</p>
                  {deviceStatus?.ultimo_heartbeat && (
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(deviceStatus.ultimo_heartbeat), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Último Heartbeat
            </h4>
            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="text-sm font-mono">
                {deviceStatus?.ultimo_heartbeat
                  ? new Date(deviceStatus.ultimo_heartbeat).toLocaleString('pt-BR')
                  : 'Nunca recebido'}
              </p>
            </div>
          </div>
        </div>

        {/* IP e URL Atual */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              IP do Dispositivo
            </h4>
            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="text-sm font-mono">
                {String(deviceStatus?.ip_address || 'Não capturado')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              URL Exibindo
            </h4>
            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="text-sm font-mono truncate" title={deviceStatus?.url_atual || 'Nenhuma'}>
                {deviceStatus?.url_atual || 'Nenhuma URL'}
              </p>
            </div>
          </div>
        </div>

        {/* Endereço Físico */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Endereço Físico (Localização do Prédio)
          </h4>
          <div className="p-3 bg-accent/50 rounded-lg">
            <p className="text-sm">{enderecoFisico}</p>
          </div>
        </div>

        {/* Informações do Dispositivo */}
        {deviceInfo && Object.keys(deviceInfo).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">
              Informações do Navegador
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {deviceInfo.userAgent && (
                <div className="p-2 bg-accent/30 rounded text-xs">
                  <span className="font-medium">User Agent:</span>
                  <p className="text-muted-foreground truncate" title={String(deviceInfo.userAgent)}>
                    {String(deviceInfo.userAgent)}
                  </p>
                </div>
              )}
              {deviceInfo.screen && (
                <div className="p-2 bg-accent/30 rounded text-xs">
                  <span className="font-medium">Resolução:</span>
                  <p className="text-muted-foreground">
                    {String(deviceInfo.screen.width)}x{String(deviceInfo.screen.height)}
                  </p>
                </div>
              )}
              {deviceInfo.language && (
                <div className="p-2 bg-accent/30 rounded text-xs">
                  <span className="font-medium">Idioma:</span>
                  <p className="text-muted-foreground">{String(deviceInfo.language)}</p>
                </div>
              )}
              {deviceInfo.timezone && (
                <div className="p-2 bg-accent/30 rounded text-xs">
                  <span className="font-medium">Timezone:</span>
                  <p className="text-muted-foreground">{String(deviceInfo.timezone)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Erro (se houver) */}
        {deviceStatus?.erro_ultimo && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Último Erro Detectado
            </h4>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{deviceStatus.erro_ultimo}</p>
            </div>
          </div>
        )}

        {/* Última Atualização */}
        <div className="pt-4 border-t text-xs text-muted-foreground text-center">
          Atualização automática a cada 30 segundos • Última atualização:{' '}
          {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  );
};

export default PanelDeviceTab;
