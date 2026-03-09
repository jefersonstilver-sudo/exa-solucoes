import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionTimeline } from "./ConnectionTimeline";
import { UptimeChart } from "./UptimeChart";
import { AssignBuildingDialog } from "./AssignBuildingDialog";
import { SelectElevatorCompanyDialog } from "./SelectElevatorCompanyDialog";
import { OfflineIncidentCard } from "./OfflineIncidentCard";
import { IncidentHistoryTab } from "./IncidentHistoryTab";
import { Monitor, Info, Clock, Settings, BarChart3, Wifi, MapPin, Tag, Activity, AlertTriangle, Bell, Building2, Link2, Unlink, Trash2, FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useRealTimeCounter } from "../../hooks/useRealTimeCounter";
import { useDeviceIncidents } from "../../hooks/useDeviceIncidents";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDynamicModulePermissions } from "@/hooks/useDynamicModulePermissions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
interface ComputerDetailModalProps {
  computer: any;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void; // Callback para quando o device for excluído
  theme: 'dark' | 'light';
  // Props para eventos proporcionais ao período selecionado
  periodEventsCount?: number;
  periodOfflineCount?: number;
  periodLabel?: string;
}

interface AlertConfig {
  alerts_enabled: boolean;
  offline_threshold_minutes: number;
}

export const ComputerDetailModal = ({ 
  computer, 
  isOpen, 
  onClose,
  onDeleted,
  theme,
  periodEventsCount,
  periodOfflineCount,
  periodLabel = 'no período'
}: ComputerDetailModalProps) => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    alerts_enabled: true,
    offline_threshold_minutes: 5,
  });
  const [loading, setLoading] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isElevatorDialogOpen, setIsElevatorDialogOpen] = useState(false);
  const [assignedBuilding, setAssignedBuilding] = useState<{ id: string; nome: string } | null>(null);
  const [elevatorCompany, setElevatorCompany] = useState<{ id: string; nome_fantasia: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const offlineCounter = useRealTimeCounter(computer?.status === 'offline' ? computer?.last_online_at : null);
  const { isMasterAccount } = useDynamicModulePermissions();
  const { activeIncident, history, loading: incidentsLoading, registerCause } = useDeviceIncidents(isOpen ? computer?.id : null);

  useEffect(() => {
    if (computer?.id && isOpen) {
      loadAlertConfig();
      loadAssignedBuilding();
      loadElevatorCompany();
    }
  }, [computer?.id, isOpen]);

  const loadAlertConfig = async () => {
    try {
      // @ts-ignore - Table will exist after migration
      const { data, error } = await (supabase as any)
        .from('device_alert_configs')
        .select('*')
        .eq('device_id', computer.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setAlertConfig({
          alerts_enabled: data.alerts_enabled,
          offline_threshold_minutes: data.offline_threshold_minutes,
        });
      }
    } catch (error) {
      console.error('Error loading alert config:', error);
    }
  };

  const loadAssignedBuilding = async () => {
    try {
      if (!computer?.building_id) {
        setAssignedBuilding(null);
        return;
      }

      const { data, error } = await supabase
        .from('buildings')
        .select('id, nome')
        .eq('id', computer.building_id)
        .single();

      if (error) {
        console.error('Error loading assigned building:', error);
        setAssignedBuilding(null);
        return;
      }

      setAssignedBuilding(data);
    } catch (error) {
      console.error('Error loading assigned building:', error);
      setAssignedBuilding(null);
    }
  };

  const loadElevatorCompany = async () => {
    try {
      if (!computer?.empresa_elevador_id) {
        setElevatorCompany(null);
        return;
      }

      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome_fantasia')
        .eq('id', computer.empresa_elevador_id)
        .single();

      if (error) {
        console.error('Error loading elevator company:', error);
        setElevatorCompany(null);
        return;
      }

      setElevatorCompany(data);
    } catch (error) {
      console.error('Error loading elevator company:', error);
      setElevatorCompany(null);
    }
  };

  const handleBuildingAssigned = () => {
    loadAssignedBuilding();
  };

  const handleElevatorCompanySelected = () => {
    loadElevatorCompany();
  };

  const saveAlertConfig = async () => {
    setLoading(true);
    try {
      // @ts-ignore - Table will exist after migration
      const { error } = await (supabase as any)
        .from('device_alert_configs')
        .upsert({
          device_id: computer.id,
          alerts_enabled: alertConfig.alerts_enabled,
          offline_threshold_minutes: alertConfig.offline_threshold_minutes,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'device_id'
        });

      if (error) throw error;

      // SYNC: Also update device metadata.notifications_paused_until
      // This ensures monitor-panels respects BOTH device_alert_configs AND metadata
      const currentMetadata = computer.metadata || {};
      let newMetadata: Record<string, any>;

      if (!alertConfig.alerts_enabled) {
        // Alerts disabled - set notifications_paused_until to 'indefinite'
        newMetadata = {
          ...currentMetadata,
          notifications_paused_until: 'indefinite',
          paused_by: 'admin_interface',
          paused_at: new Date().toISOString()
        };
      } else {
        // Alerts enabled - clear pause
        newMetadata = {
          ...currentMetadata,
          notifications_paused_until: null,
          paused_by: null,
          paused_at: null
        };
      }

      await supabase
        .from('devices')
        .update({ metadata: newMetadata })
        .eq('id', computer.id);

      toast.success('Configurações de alertas salvas com sucesso!');
    } catch (error) {
      console.error('Error saving alert config:', error);
      toast.error('Erro ao salvar configurações de alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async () => {
    setIsDeleting(true);
    try {
      // Soft delete - marcar como excluído em vez de deletar
      // Isso evita que o sync-anydesk recrie o device
      const { error } = await supabase
        .from('devices')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: 'admin_master',
          status: 'deleted', // Marcar status para filtrar na UI
        })
        .eq('id', computer.id);

      if (error) throw error;

      toast.success(`Painel "${displayName}" excluído permanentemente!`);
      onClose();
      
      // Chamar callback para atualizar a lista
      if (onDeleted) {
        onDeleted();
      }
    } catch (error) {
      console.error('Erro ao excluir painel:', error);
      toast.error('Erro ao excluir painel');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!computer) return null;

  const isOnline = computer.status === "online";
  // Usar apenas o nome do prédio parseado, não o comments completo
  const displayName = computer.name || computer.condominio_name || computer.hostname;

  const themeClass = theme === 'dark' ? 'theme-dark' : 'theme-light';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-7xl max-h-[95vh] overflow-y-auto ${themeClass} !bg-module-primary !border-module !shadow-lg`}>
        <div className="glass-card bg-module-card border-module rounded-lg p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-module-primary">
              <Monitor className="h-6 w-6 text-module-accent" />
              <span>{displayName}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detalhes completos do painel {displayName}
            </DialogDescription>
          </DialogHeader>

          {/* 3 CARDS SUPERIORES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* CARD 1: INFORMAÇÕES DO SISTEMA */}
            <Card className="bg-module-card border-module shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-module-primary">
                  <Info className="h-4 w-4 text-module-accent" />
                  Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-module-secondary mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Local/Prédio
                  </p>
                  <p className="text-base font-semibold text-module-primary">{displayName}</p>
                </div>
                <div>
                  <p className="text-xs text-module-secondary mb-1 flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    Provedor
                  </p>
                  <Badge variant="outline" className="text-module-primary border-module bg-module-secondary">
                    {computer.provider || 'Sem provedor'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-module-secondary mb-1">Endereço</p>
                  <p className="text-sm text-module-primary">{computer.address || 'Sem endereço'}</p>
                </div>
                {computer.tags && Array.isArray(computer.tags) && computer.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-module-secondary mb-1 flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {computer.tags.map((tag: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs text-module-primary border-module bg-module-secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CARD 2: ATIVIDADE */}
            <Card className="bg-module-card border-module shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-module-primary">
                  <Activity className="h-4 w-4 text-module-accent" />
                  Atividade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-module-secondary mb-1">Status Atual</p>
                  <Badge
                    className={cn(
                      "flex items-center gap-1 w-fit",
                      isOnline 
                        ? "bg-green-100 text-green-700 border-green-300" 
                        : "bg-red-100 text-red-700 border-red-300"
                    )}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-module-secondary mb-1">Última Conexão</p>
                  <p className="text-sm font-semibold text-module-primary">
                    {computer.status === 'offline' ? (
                      <span className="text-red-600">Offline há {offlineCounter}</span>
                    ) : (
                      <span className="text-green-600">Online agora</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-module-secondary mb-1">
                    Eventos {periodLabel}
                  </p>
                  <p className="text-2xl font-bold text-module-primary">
                    {periodEventsCount !== undefined ? periodEventsCount : (computer.total_events || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-module-secondary mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    Quedas {periodLabel}
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {periodOfflineCount !== undefined ? periodOfflineCount : (computer.offline_count || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* CARD 3: CONFIGURAÇÃO DE ALERTAS */}
            <Card className="bg-module-card border-module shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-module-primary">
                  <Bell className="h-4 w-4 text-module-accent" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="alerts-enabled" className="text-sm text-module-primary">Alertas Automáticos</Label>
                  <Switch
                    id="alerts-enabled"
                    checked={alertConfig.alerts_enabled}
                    onCheckedChange={(checked) => setAlertConfig({ ...alertConfig, alerts_enabled: checked })}
                  />
                </div>
                <div>
                  <Label htmlFor="threshold" className="text-xs text-module-secondary">
                    Alertar após (minutos offline)
                  </Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="1"
                    value={alertConfig.offline_threshold_minutes}
                    onChange={(e) => setAlertConfig({ ...alertConfig, offline_threshold_minutes: parseInt(e.target.value) || 5 })}
                    className="mt-1 bg-module-secondary border-module text-module-primary"
                  />
                </div>
                <Button 
                  onClick={saveAlertConfig} 
                  disabled={loading}
                  className="w-full bg-module-accent hover:bg-module-accent-hover text-white"
                  size="sm"
                >
                  {loading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </CardContent>
            </Card>

            {/* CARD 4: PRÉDIO ATRIBUÍDO */}
            <Card className="bg-module-card border-module shadow-sm md:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-module-primary">
                  <Building2 className="h-4 w-4 text-module-accent" />
                  Prédio Atribuído (Loja)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {assignedBuilding ? (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Link2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-emerald-700">{assignedBuilding.nome}</p>
                          <p className="text-xs text-module-secondary">Vinculado à loja</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Unlink className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Não atribuído</p>
                          <p className="text-xs text-module-secondary">Clique para vincular a um prédio</p>
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    onClick={() => setIsAssignDialogOpen(true)}
                    variant={assignedBuilding ? "outline" : "default"}
                    size="sm"
                    className={assignedBuilding ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50" : "bg-module-accent hover:bg-module-accent-hover text-white"}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {assignedBuilding ? 'Alterar Prédio' : 'Atribuir Prédio'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CARD 5: EMPRESA DE ELEVADOR */}
            <Card className="bg-module-card border-module shadow-sm md:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-module-primary">
                  🛗 Empresa de Elevador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {elevatorCompany ? (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="text-xl">🛗</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-700">{elevatorCompany.nome_fantasia}</p>
                          <p className="text-xs text-module-secondary">Empresa responsável</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-xl opacity-40">🛗</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Não definida</p>
                          <p className="text-xs text-module-secondary">Clique para selecionar empresa</p>
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    onClick={() => setIsElevatorDialogOpen(true)}
                    variant={elevatorCompany ? "outline" : "default"}
                    size="sm"
                    className={elevatorCompany ? "border-blue-300 text-blue-700 hover:bg-blue-50" : "bg-module-accent hover:bg-module-accent-hover text-white"}
                  >
                    🛗 {elevatorCompany ? 'Alterar Empresa' : 'Selecionar Empresa'}
                  </Button>
                </div>
              </CardContent>
            </Card>


            {/* CARD 6: INCIDENTE OFFLINE */}
            {!isOnline && (
              <OfflineIncidentCard
                incident={activeIncident}
                onRegisterCause={registerCause}
              />
            )}

            {isMasterAccount && !isOnline && (
              <Card className="bg-red-50 border-red-200 shadow-sm md:col-span-3">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                    <Trash2 className="h-4 w-4" />
                    Zona de Perigo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">
                        Excluir este painel permanentemente
                      </p>
                      <p className="text-xs text-red-500">
                        Esta ação não pode ser desfeita. Todos os dados serão perdidos.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Painel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão Permanente</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <span className="block">
                              Você está prestes a excluir permanentemente o painel <strong>{displayName}</strong>.
                            </span>
                            <span className="block">
                              Esta ação irá remover todos os dados, histórico de eventos e configurações deste painel. Esta ação <strong>NÃO</strong> pode ser desfeita.
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteDevice}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isDeleting ? 'Excluindo...' : 'Sim, excluir permanentemente'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* INFORMAÇÕES ADICIONAIS */}
          <Card className="mb-6 bg-module-card border-module shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-module-primary">Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-module-secondary mb-1">AnyDesk ID</p>
                  <p className="text-sm font-mono text-module-primary">{computer.anydesk_client_id}</p>
                </div>
                <div>
                  <p className="text-xs text-module-secondary mb-1">Online-Time</p>
                  <p className="text-sm text-module-primary">{computer.metadata?.online_time || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-module-secondary mb-1">Client-Version</p>
                  <p className="text-sm text-module-primary">{computer.metadata?.version || '7.0.0'}</p>
                </div>
                <div>
                  <p className="text-xs text-module-secondary mb-1">IP Público</p>
                  <p className="text-sm font-mono text-module-primary">{computer.metadata?.ip_address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-module-secondary mb-1">Sistema</p>
                  <p className="text-sm text-module-primary">{computer.metadata?.os || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-module-secondary mb-1">Condomínio</p>
                  <p className="text-sm text-module-primary">{computer.condominio_name || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TABS */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-module-secondary border-module">
              <TabsTrigger value="info" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground">
                <Info className="h-4 w-4 mr-2" />
                Informações
              </TabsTrigger>
              <TabsTrigger value="incidentes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground">
                <FileWarning className="h-4 w-4 mr-2" />
                Incidentes
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground">
                <Clock className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="graficos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground">
                <BarChart3 className="h-4 w-4 mr-2" />
                Gráficos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <Card className="bg-module-card border-module shadow-sm">
                <CardHeader>
                  <CardTitle className="text-module-primary">Resumo Completo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-module-primary">
                  <p><strong>Nome:</strong> {displayName}</p>
                  <p><strong>Status:</strong> {computer.status}</p>
                  <p><strong>Provedor:</strong> {computer.provider || 'Não identificado'}</p>
                  <p><strong>Endereço:</strong> {computer.address || 'Não informado'}</p>
                  <p><strong>Total Eventos:</strong> {computer.total_events || 0}</p>
                  <p><strong>Quedas:</strong> {computer.offline_count || 0}</p>
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="incidentes" className="mt-4">
              <IncidentHistoryTab incidents={history} loading={incidentsLoading} />
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <ConnectionTimeline computerId={computer.id} />
            </TabsContent>

            <TabsContent value="graficos" className="mt-4">
              <UptimeChart computerId={computer.id} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* Dialog de Atribuição de Prédio */}
      <AssignBuildingDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        deviceId={computer?.id || ''}
        deviceName={displayName}
        currentBuildingId={computer?.building_id || null}
        onAssigned={handleBuildingAssigned}
      />

      {/* Dialog de Seleção de Empresa de Elevador */}
      <SelectElevatorCompanyDialog
        isOpen={isElevatorDialogOpen}
        onClose={() => setIsElevatorDialogOpen(false)}
        deviceId={computer?.id || ''}
        currentCompanyId={computer?.empresa_elevador_id || null}
        onCompanySelected={handleElevatorCompanySelected}
      />
    </Dialog>
  );
};
