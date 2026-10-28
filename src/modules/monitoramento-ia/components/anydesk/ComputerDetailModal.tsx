import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionTimeline } from "./ConnectionTimeline";
import { UptimeChart } from "./UptimeChart";
import { AssignBuildingDialog } from "./AssignBuildingDialog";
import { SelectElevatorCompanyDialog } from "./SelectElevatorCompanyDialog";
import { OfflineIncidentCard } from "./OfflineIncidentCard";
import { IncidentHistoryTab } from "./IncidentHistoryTab";
import { AuditoriaCard } from "./AuditoriaCard";
import { DiagnosticoTab } from "./DiagnosticoTab";
import { PainelResumoEXA } from "../paineis/PainelResumoEXA";
import type { FrotaPainel } from "../../hooks/useFrotaSaude";
import { Stethoscope, Monitor, Info, Clock, Settings, BarChart3, Wifi, MapPin, Tag, Activity, AlertTriangle, Building2, Pencil, Trash2, FileWarning, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  onDeleted?: () => void;
  onIncidentUpdate?: () => void;
  onGroupChanged?: () => void;
  theme: 'dark' | 'light';
  periodEventsCount?: number;
  periodOfflineCount?: number;
  periodLabel?: string;
  deviceGroups?: { id: string; nome: string; cor: string; ordem: number }[];
  moveDeviceToGroup?: (deviceId: string, groupId: string | null) => Promise<void>;
  saude?: FrotaPainel | null;
}

export const ComputerDetailModal = ({ 
  computer, 
  isOpen, 
  onClose,
  onDeleted,
  onIncidentUpdate,
  onGroupChanged,
  theme,
  periodEventsCount,
  periodOfflineCount,
  periodLabel = 'no período',
  deviceGroups = [],
  moveDeviceToGroup,
  saude,
}: ComputerDetailModalProps) => {
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
      loadAssignedBuilding();
      loadElevatorCompany();
    }
  }, [computer?.id, isOpen]);

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

          <PainelResumoEXA
            computer={computer}
            saude={saude}
            predioNome={assignedBuilding?.nome}
            elevadorNome={elevatorCompany?.nome_fantasia}
            grupoNome={deviceGroups.find((g) => g.id === computer.device_group_id)?.nome}
          />

          {/* 3 CARDS SUPERIORES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {/* CARD 1: INFORMAÇÕES DO SISTEMA */}
            <Card className="bg-module-card border-module shadow-sm min-w-0">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-module-primary">
                  <Info className="h-4 w-4 text-module-accent" />
                  Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <div>
                  <p className="text-xs text-module-secondary mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Local/Prédio
                  </p>
                  <p className="text-sm font-semibold break-words text-module-primary">{displayName}</p>
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
            <Card className="bg-module-card border-module shadow-sm min-w-0">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-module-primary">
                  <Activity className="h-4 w-4 text-module-accent" />
                  Atividade
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
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
                <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-module-secondary mb-1">
                    Eventos {periodLabel}
                  </p>
                  <p className="text-lg font-bold text-module-primary">
                    {periodEventsCount !== undefined ? periodEventsCount : (computer.total_events || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-module-secondary mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    Quedas {periodLabel}
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    {periodOfflineCount !== undefined ? periodOfflineCount : (computer.offline_count || 0)}
                  </p>
                </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 3: VÍNCULOS DO PAINEL */}
            <Card className="bg-module-card border-module shadow-sm min-w-0">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-module-primary">
                  <Layers className="h-4 w-4 text-module-accent" />
                  Vínculos do Painel
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-module-secondary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-module-secondary">Prédio Atribuído (Loja)</p>
                    <p className="text-sm font-medium text-module-primary break-words">{assignedBuilding?.nome || 'Não atribuído'}</p>
                  </div>
                  <Button onClick={() => setIsAssignDialogOpen(true)} variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-module-accent" aria-label={assignedBuilding ? 'Alterar Prédio' : 'Atribuir Prédio'} title={assignedBuilding ? 'Alterar Prédio' : 'Atribuir Prédio'}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 border-t border-module pt-2">
                  <Layers className="h-4 w-4 shrink-0 text-module-secondary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-module-secondary mb-1">Grupo do Painel</p>
                    <Select
                      value={computer?.device_group_id || '__none__'}
                      onValueChange={async (val) => {
                        if (moveDeviceToGroup && computer?.id) {
                          await moveDeviceToGroup(computer.id, val === '__none__' ? null : val);
                          onGroupChanged?.();
                          onClose();
                        }
                      }}
                    >
                      <SelectTrigger aria-label="Grupo do Painel" className="w-full min-h-11 bg-module-secondary border-module text-module-primary">
                        <SelectValue placeholder="Selecionar grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sem grupo</SelectItem>
                        {deviceGroups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-module pt-2">
                  <span className="shrink-0" aria-hidden="true">🛗</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-module-secondary">Empresa de Elevador</p>
                    <p className="text-sm font-medium text-module-primary break-words">{elevatorCompany?.nome_fantasia || 'Não definida'}</p>
                  </div>
                  <Button onClick={() => setIsElevatorDialogOpen(true)} variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-module-accent" aria-label={elevatorCompany ? 'Alterar Empresa' : 'Selecionar Empresa'} title={elevatorCompany ? 'Alterar Empresa' : 'Selecionar Empresa'}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CARD 6: INCIDENTE OFFLINE */}
            {!isOnline && (
              <OfflineIncidentCard
                incident={activeIncident}
                onRegisterCause={async (incidentId, categoryId, causa, resolucao) => {
                  await registerCause(incidentId, categoryId, causa, resolucao);
                  onIncidentUpdate?.();
                }}
                isDeviceOffline={!isOnline}
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

          {/* AUDITORIA DE HARDWARE & REDE (super código v6/v6.1) */}
          <AuditoriaCard metadata={computer.metadata} />

          {/* TABS */}
          <Tabs defaultValue="diagnostico" className="w-full">
            <TabsList className="flex w-full justify-start overflow-x-auto sm:grid sm:grid-cols-5 bg-module-secondary border-module">
              <TabsTrigger value="diagnostico" className="shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-foreground">
                <Stethoscope className="h-4 w-4 mr-2" />
                Diagnóstico
              </TabsTrigger>
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

            <TabsContent value="diagnostico" className="mt-4">
              <DiagnosticoTab computerId={computer.id} />
            </TabsContent>

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
