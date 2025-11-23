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
      <div className="bg-background rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <Monitor className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">{device.comments || device.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{device.condominio_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-accent rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-card px-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap font-medium ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
          {activeTab === 'informacoes' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sistema Card */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-primary" />
                    Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nome do Prédio</p>
                    <p className="font-semibold text-foreground">{device.comments || device.name}</p>
                  </div>
                  
                  {device.provider && device.provider !== 'Sem provedor' && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Provedor</p>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold">
                        {device.provider}
                      </Badge>
                    </div>
                  )}
                  
                  {device.address && device.address !== 'Sem endereço' && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Endereço</p>
                      <p className="text-sm text-foreground">{device.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Atividade Card */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Atividade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Status Atual</p>
                    {getStatusBadge()}
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Última Conexão</p>
                    <p className="text-sm font-medium text-foreground">
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
                    <p className="text-sm text-muted-foreground mb-1">Total de Eventos</p>
                    <p className="text-2xl font-bold text-primary">{device.total_events || 0}</p>
                  </div>
                  
                  {device.offline_count !== undefined && device.offline_count > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Quedas</p>
                      <Badge variant="destructive" className="font-semibold">
                        {device.offline_count}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alertas Card */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Alertas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Alertas Automáticos</p>
                      <p className="text-xs text-muted-foreground">Notificações quando offline</p>
                    </div>
                    <Switch checked={autoAlerts} onCheckedChange={setAutoAlerts} />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Alertar após (minutos offline)
                    </label>
                    <Input
                      type="number"
                      value={alertMinutes}
                      onChange={(e) => setAlertMinutes(Number(e.target.value))}
                      min={1}
                      max={60}
                      className="bg-background border-border"
                    />
                  </div>
                  
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    Salvar Configurações
                  </Button>
                </CardContent>
              </Card>

              {/* Informações Adicionais Card - Full Width */}
              <Card className="lg:col-span-3 bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
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
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAlerts ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p>Carregando histórico...</p>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-lg font-medium">Nenhum evento registrado</p>
                    <p className="text-sm mt-1">Os eventos aparecerão aqui quando ocorrerem</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors bg-card"
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
                            <span className="text-sm font-medium text-foreground">
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
                        <div className="text-xs text-muted-foreground">
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
              <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Gráficos</h3>
                      <p className="text-sm text-muted-foreground">Ver estatísticas detalhadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Timeline</h3>
                      <p className="text-sm text-muted-foreground">Histórico de eventos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border bg-card">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border"
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
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-sm font-semibold text-foreground truncate">{value}</p>
  </div>
);
