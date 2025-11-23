import { useState, useEffect } from 'react';
import { X, Activity, HardDrive, Clock, AlertCircle, MapPin, Wifi, Monitor, Server, Info, Bell } from 'lucide-react';
import { Device, formatUptime, formatTemperature, fetchDeviceAlerts } from '../utils/devices';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PanelDetailModalProps {
  device: Device;
  onClose: () => void;
  onUpdate: () => void;
}

type Tab = 'informacoes' | 'atividade' | 'alertas';

export const PanelDetailModal = ({ device, onClose, onUpdate }: PanelDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('informacoes');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [autoAlerts, setAutoAlerts] = useState(true);
  const [alertMinutes, setAlertMinutes] = useState(5);

  useEffect(() => {
    if (activeTab === 'atividade') {
      loadAlerts();
    }
  }, [activeTab]);

  const loadAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const data = await fetchDeviceAlerts(device.id);
      setAlerts(data || []);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const tabs = [
    { id: 'informacoes', label: 'Informações', icon: Info },
    { id: 'atividade', label: 'Atividade', icon: Activity },
    { id: 'alertas', label: 'Alertas', icon: Bell },
  ] as const;

  const getStatusBadge = () => {
    if (device.status === 'online') {
      return <Badge className="bg-green-500 text-white hover:bg-green-600">Online</Badge>;
    }
    return <Badge variant="destructive">Offline</Badge>;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col border border-module-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-module-border glass-card">
          <div className="flex items-center gap-4">
            <Monitor className="h-8 w-8 text-module-accent" />
            <div>
              <h2 className="text-2xl font-bold text-module-primary">{device.comments || device.name}</h2>
              <p className="text-sm text-module-secondary mt-1">{device.condominio_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-module-secondary hover:text-module-primary transition-colors p-2 hover:bg-module-accent/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-module-border glass-card px-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap font-medium ${
                  activeTab === tab.id
                    ? 'border-module-accent text-module-accent'
                    : 'border-transparent text-module-secondary hover:text-module-primary hover:bg-module-accent/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-module-bg">
          {activeTab === 'informacoes' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sistema Card */}
              <Card className="glass-card border-module-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-module-primary">
                    <HardDrive className="h-5 w-5 text-module-accent" />
                    Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-module-secondary mb-1">Nome do Prédio</p>
                    <p className="font-semibold text-module-primary">{device.comments || device.name}</p>
                  </div>
                  
                  {device.provider && device.provider !== 'Sem provedor' && (
                    <div>
                      <p className="text-sm text-module-secondary mb-2">Provedor</p>
                      <Badge variant="outline" className="bg-module-accent/10 text-module-accent border-module-accent/20 font-semibold">
                        {device.provider}
                      </Badge>
                    </div>
                  )}
                  
                  {device.address && device.address !== 'Sem endereço' && (
                    <div>
                      <p className="text-sm text-module-secondary mb-1">Endereço</p>
                      <p className="text-sm text-module-primary">{device.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Atividade Card */}
              <Card className="glass-card border-module-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-module-primary">
                    <Activity className="h-5 w-5 text-module-accent" />
                    Atividade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-module-secondary mb-2">Status Atual</p>
                    {getStatusBadge()}
                  </div>
                  
                  <div>
                    <p className="text-sm text-module-secondary mb-1">Última Conexão</p>
                    <p className="text-sm font-medium text-module-primary">
                      {device.last_online_at ? (
                        <>
                          {device.status === 'online' ? 'Online agora' : format(new Date(device.last_online_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </>
                      ) : (
                        'Nunca conectado'
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-module-secondary mb-1">Total de Eventos</p>
                    <p className="text-2xl font-bold text-module-accent">{device.total_events || 0}</p>
                  </div>
                  
                  {device.offline_count !== undefined && device.offline_count > 0 && (
                    <div>
                      <p className="text-sm text-module-secondary mb-1">Quedas</p>
                      <Badge variant="destructive" className="font-semibold">
                        {device.offline_count}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alertas Card */}
              <Card className="glass-card border-module-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-module-primary">
                    <Bell className="h-5 w-5 text-module-accent" />
                    Alertas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-module-primary">Alertas Automáticos</p>
                      <p className="text-xs text-module-secondary">Notificações quando offline</p>
                    </div>
                    <Switch checked={autoAlerts} onCheckedChange={setAutoAlerts} />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-module-primary block mb-2">
                      Alertar após (minutos offline)
                    </label>
                    <Input
                      type="number"
                      value={alertMinutes}
                      onChange={(e) => setAlertMinutes(Number(e.target.value))}
                      min={1}
                      max={60}
                      className="bg-module-input border-module-border text-module-primary"
                    />
                  </div>
                  
                  <Button className="w-full bg-module-accent hover:bg-module-accent-hover text-white font-semibold">
                    Salvar Configurações
                  </Button>
                </CardContent>
              </Card>

              {/* Informações Adicionais Card - Full Width */}
              <Card className="lg:col-span-3 glass-card border-module-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-module-primary">
                    <Info className="h-5 w-5 text-module-accent" />
                    Informações Adicionais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <InfoItem label="AnyDesk ID" value={device.anydesk_client_id} />
                    <InfoItem label="Online-Time" value={device.metadata?.online_time || 'N/A'} />
                    <InfoItem label="Client-Version" value="7.0.0" />
                    <InfoItem label="IP Público" value="N/A" />
                    <InfoItem label="Sistema" value={device.metadata?.os_info || 'N/A'} />
                    <InfoItem label="Condomínio" value={device.condominio_name} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'atividade' && (
            <Card className="glass-card border-module-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-module-primary">
                  <Clock className="h-5 w-5 text-module-accent" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAlerts ? (
                  <div className="text-center py-12 text-module-secondary">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-module-accent" />
                    <p>Carregando histórico...</p>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-12 text-module-secondary">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-module-secondary/50" />
                    <p className="text-lg font-medium">Nenhum evento registrado</p>
                    <p className="text-sm mt-1">Os eventos aparecerão aqui quando ocorrerem</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-4 border border-module-border rounded-lg hover:bg-module-accent/10 transition-colors glass-card"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                alert.severity === 'high'
                                  ? 'destructive'
                                  : alert.severity === 'medium'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="font-medium"
                            >
                              {alert.severity}
                            </Badge>
                            <span className="text-sm font-medium text-module-primary">
                              {alert.alert_type}
                            </span>
                          </div>
                          <Badge
                            variant={alert.status === 'resolved' ? 'outline' : 'secondary'}
                            className={
                              alert.status === 'resolved'
                                ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                                : ''
                            }
                          >
                            {alert.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-module-secondary">
                          {format(new Date(alert.opened_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'alertas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="glass-card border-module-border hover:border-module-accent/50 transition-colors cursor-pointer hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-module-accent/10 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-module-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-module-primary">Gráficos</h3>
                      <p className="text-sm text-module-secondary">Ver estatísticas detalhadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-module-border hover:border-module-accent/50 transition-colors cursor-pointer hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-module-accent/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-module-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-module-primary">Timeline</h3>
                      <p className="text-sm text-module-secondary">Histórico de eventos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-module-border glass-card">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-module-border hover:bg-module-accent/10 text-module-primary"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <p className="text-xs text-module-secondary mb-1">{label}</p>
    <p className="text-sm font-semibold text-module-primary truncate">{value}</p>
  </div>
);
