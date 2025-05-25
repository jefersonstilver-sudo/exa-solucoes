import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Monitor, 
  Settings, 
  Network, 
  Eye,
  EyeOff,
  Copy,
  Wifi,
  WifiOff,
  MapPin,
  Calendar,
  Building
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface PanelDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panel?: any;
}

const PanelDetailsDialog: React.FC<PanelDetailsDialogProps> = ({
  open,
  onOpenChange,
  panel
}) => {
  const [showPassword, setShowPassword] = useState(false);

  if (!panel) return null;

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { variant: any, label: string, icon: any, color: string }> = {
      online: { variant: 'success', label: 'Online', icon: Wifi, color: 'text-green-600' },
      offline: { variant: 'destructive', label: 'Offline', icon: WifiOff, color: 'text-red-600' },
      maintenance: { variant: 'secondary', label: 'Manutenção', icon: Settings, color: 'text-orange-500' }
    };
    return statusMap[status] || statusMap.offline;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência`);
  };

  const statusInfo = getStatusInfo(panel.status);
  const StatusIcon = statusInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            <Monitor className="h-6 w-6 mr-2" />
            Detalhes do Painel - {panel.code}
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações e configurações do painel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Info Principal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Status Atual</span>
                <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Prédio</p>
                    <p className="text-xs text-gray-500">{panel.buildings?.nome || 'N/A'}</p>
                  </div>
                </div>
                {panel.localizacao && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Localização</p>
                      <p className="text-xs text-gray-500">{panel.localizacao}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Última Sync</p>
                    <p className="text-xs text-gray-500">
                      {panel.ultima_sync 
                        ? new Date(panel.ultima_sync).toLocaleString('pt-BR')
                        : 'Nunca'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Código</p>
                    <p className="text-xs text-gray-500">{panel.code}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="technical" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="technical">Técnico</TabsTrigger>
              <TabsTrigger value="network">Rede</TabsTrigger>
              <TabsTrigger value="remote">Acesso Remoto</TabsTrigger>
              <TabsTrigger value="additional">Adicional</TabsTrigger>
            </TabsList>

            <TabsContent value="technical" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Especificações Técnicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">Modelo</h4>
                        <p className="text-sm">{panel.modelo || 'Não informado'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">Tamanho</h4>
                        <p className="text-sm">{panel.polegada ? `${panel.polegada}"` : 'Não informado'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">Orientação</h4>
                        <p className="text-sm capitalize">{panel.orientacao || 'Não informado'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">Resolução</h4>
                        <p className="text-sm">{panel.resolucao || 'Não informado'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">Sistema Operacional</h4>
                        <p className="text-sm capitalize">{panel.sistema_operacional || 'Não informado'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">Versão do Firmware</h4>
                        <p className="text-sm">{panel.versao_firmware || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="network" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Rede</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">IP Interno</h4>
                        <p className="text-sm">{panel.ip_interno || 'Não configurado'}</p>
                      </div>
                      {panel.ip_interno && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(panel.ip_interno, 'IP Interno')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">Endereço MAC</h4>
                        <p className="text-sm font-mono">{panel.mac_address || 'Não configurado'}</p>
                      </div>
                      {panel.mac_address && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(panel.mac_address, 'Endereço MAC')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="remote" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Acesso Remoto - AnyDesk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">Código AnyDesk</h4>
                        <p className="text-sm font-mono">{panel.codigo_anydesk || 'Não configurado'}</p>
                      </div>
                      {panel.codigo_anydesk && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(panel.codigo_anydesk, 'Código AnyDesk')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">Senha AnyDesk</h4>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-mono">
                            {panel.senha_anydesk 
                              ? (showPassword ? panel.senha_anydesk : '••••••••')
                              : 'Não configurada'
                            }
                          </p>
                          {panel.senha_anydesk && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
                      </div>
                      {panel.senha_anydesk && showPassword && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(panel.senha_anydesk, 'Senha AnyDesk')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Adicionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Observações</h4>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">{panel.observacoes || 'Nenhuma observação registrada'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">Data de Criação</h4>
                        <p className="text-sm">
                          {new Date(panel.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">ID do Painel</h4>
                        <p className="text-sm font-mono text-xs">{panel.id}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PanelDetailsDialog;
