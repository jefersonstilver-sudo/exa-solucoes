
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, RefreshCw, Wifi, WifiOff, Wrench, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AssignedPanelsTabProps {
  buildingId?: string;
  buildingName?: string;
}

interface Panel {
  id: string;
  code: string;
  status: string;
  ultima_sync: string;
  resolucao: string;
  polegada: string;
  orientacao: string;
  sistema_operacional: string;
  localizacao: string;
  codigo_anydesk: string;
  ip_interno: string;
  mac_address: string;
  observacoes: string;
}

const AssignedPanelsTab: React.FC<AssignedPanelsTabProps> = ({ 
  buildingId, 
  buildingName
}) => {
  const [assignedPanels, setAssignedPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAssignedPanels = async () => {
    if (!buildingId) return;
    
    setLoading(true);
    try {
      console.log('🔍 [ASSIGNED PANELS] Buscando painéis para prédio:', buildingId);
      
      const { data: panels, error } = await supabase
        .from('painels')
        .select('*')
        .eq('building_id', buildingId)
        .order('code');

      if (error) {
        console.error('❌ [ASSIGNED PANELS] Erro ao buscar painéis:', error);
        toast.error('Erro ao carregar painéis do prédio');
        return;
      }

      console.log('✅ [ASSIGNED PANELS] Painéis encontrados:', panels?.length || 0);
      setAssignedPanels(panels || []);
    } catch (error) {
      console.error('💥 [ASSIGNED PANELS] Erro crítico:', error);
      toast.error('Erro crítico ao carregar painéis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedPanels();
  }, [buildingId]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'online':
        return {
          label: 'Online',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: Wifi
        };
      case 'offline':
        return {
          label: 'Offline',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: WifiOff
        };
      case 'maintenance':
        return {
          label: 'Manutenção',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Wrench
        };
      default:
        return {
          label: status || 'Desconhecido',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Monitor
        };
    }
  };

  if (!buildingId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Prédio não identificado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Painéis Atribuídos a {buildingName}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAssignedPanels}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-indexa-purple mr-2" />
              <span className="text-gray-600">Carregando painéis atribuídos...</span>
            </div>
          ) : assignedPanels.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum painel atribuído
              </h3>
              <p className="text-gray-500">
                Este prédio ainda não possui painéis atribuídos.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Total de <span className="font-semibold">{assignedPanels.length}</span> painéis atribuídos a este prédio
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedPanels.map((panel) => {
                  const statusConfig = getStatusConfig(panel.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <Card key={panel.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header do painel */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Monitor className="h-4 w-4 text-indexa-purple" />
                              <span className="font-semibold text-gray-900">{panel.code}</span>
                            </div>
                            <Badge className={`${statusConfig.color} border flex items-center space-x-1`}>
                              <StatusIcon className="h-3 w-3" />
                              <span>{statusConfig.label}</span>
                            </Badge>
                          </div>

                          {/* Informações técnicas */}
                          <div className="space-y-2 text-sm">
                            {panel.resolucao && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Resolução:</span>
                                <span className="font-medium">{panel.resolucao}</span>
                              </div>
                            )}
                            {panel.polegada && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Tamanho:</span>
                                <span className="font-medium">{panel.polegada}"</span>
                              </div>
                            )}
                            {panel.orientacao && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Orientação:</span>
                                <span className="font-medium capitalize">{panel.orientacao}</span>
                              </div>
                            )}
                            {panel.sistema_operacional && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Sistema:</span>
                                <span className="font-medium capitalize">{panel.sistema_operacional}</span>
                              </div>
                            )}
                            {panel.localizacao && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Localização:</span>
                                <span className="font-medium">{panel.localizacao}</span>
                              </div>
                            )}
                            {panel.codigo_anydesk && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">AnyDesk:</span>
                                <span className="font-medium font-mono text-xs">{panel.codigo_anydesk}</span>
                              </div>
                            )}
                            {panel.ip_interno && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">IP Interno:</span>
                                <span className="font-medium font-mono text-xs">{panel.ip_interno}</span>
                              </div>
                            )}
                            {panel.ultima_sync && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Última Sync:</span>
                                <span className="font-medium text-xs">
                                  {new Date(panel.ultima_sync).toLocaleString('pt-BR')}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Observações se houver */}
                          {panel.observacoes && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-gray-600">
                                <strong>Obs:</strong> {panel.observacoes}
                              </p>
                            </div>
                          )}

                          {/* Ações */}
                          <div className="pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                // Aqui poderia abrir um modal com mais detalhes ou navegar para detalhes do painel
                                console.log('Ver detalhes do painel:', panel.id);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignedPanelsTab;
