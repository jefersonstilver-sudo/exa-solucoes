import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionTimeline } from "./ConnectionTimeline";
import { UptimeChart } from "./UptimeChart";
import { Monitor, Info, Clock, Settings, BarChart3, Wifi, MapPin, Tag, Activity, AlertTriangle, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useRealTimeCounter } from "../../hooks/useRealTimeCounter";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ComputerDetailModalProps {
  computer: any;
  isOpen: boolean;
  onClose: () => void;
}

interface AlertConfig {
  alerts_enabled: boolean;
  offline_threshold_minutes: number;
}

export const ComputerDetailModal = ({ 
  computer, 
  isOpen, 
  onClose 
}: ComputerDetailModalProps) => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    alerts_enabled: true,
    offline_threshold_minutes: 5,
  });
  const [loading, setLoading] = useState(false);

  const offlineCounter = useRealTimeCounter(computer?.status === 'offline' ? computer?.last_online_at : null);

  useEffect(() => {
    if (computer?.id && isOpen) {
      loadAlertConfig();
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
      toast.success('Configurações de alertas salvas com sucesso!');
    } catch (error) {
      console.error('Error saving alert config:', error);
      toast.error('Erro ao salvar configurações de alertas');
    } finally {
      setLoading(false);
    }
  };

  if (!computer) return null;

  const isOnline = computer.status === "online";
  // Usar apenas o nome do prédio parseado, não o comments completo
  const displayName = computer.name || computer.condominio_name || computer.hostname;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto !bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <Monitor className="h-6 w-6 text-[#9C1E1E]" />
            <span>{displayName}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes completos do painel {displayName}
          </DialogDescription>
        </DialogHeader>

        {/* 3 CARDS SUPERIORES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* CARD 1: INFORMAÇÕES DO SISTEMA */}
          <Card className="!bg-card !border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 !text-card-foreground">
                <Info className="h-4 w-4 text-[#9C1E1E]" />
                Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Local/Prédio
                </p>
                <p className="text-base font-semibold !text-card-foreground">{displayName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Provedor
                </p>
                <Badge variant="outline" className="!text-card-foreground">
                  {computer.provider || 'Sem provedor'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Endereço</p>
                <p className="text-sm !text-card-foreground">{computer.address || 'Sem endereço'}</p>
              </div>
              {computer.tags && Array.isArray(computer.tags) && computer.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {computer.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs !text-card-foreground">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD 2: ATIVIDADE */}
          <Card className="!bg-card !border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 !text-card-foreground">
                <Activity className="h-4 w-4 text-[#9C1E1E]" />
                Atividade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status Atual</p>
                <Badge
                  className={cn(
                    "flex items-center gap-1 w-fit",
                    isOnline 
                      ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30" 
                      : "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30"
                  )}
                >
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Última Conexão</p>
                <p className="text-sm font-semibold !text-card-foreground">
                  {computer.status === 'offline' ? (
                    <span className="text-red-600 dark:text-red-400">Offline há {offlineCounter}</span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400">Online agora</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total de Eventos</p>
                <p className="text-2xl font-bold !text-card-foreground">{computer.total_events || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
                  Quedas
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{computer.offline_count || 0}</p>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: CONFIGURAÇÃO DE ALERTAS */}
          <Card className="!bg-card !border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 !text-card-foreground">
                <Bell className="h-4 w-4 text-[#9C1E1E]" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="alerts-enabled" className="text-sm !text-card-foreground">Alertas Automáticos</Label>
                <Switch
                  id="alerts-enabled"
                  checked={alertConfig.alerts_enabled}
                  onCheckedChange={(checked) => setAlertConfig({ ...alertConfig, alerts_enabled: checked })}
                />
              </div>
              <div>
                <Label htmlFor="threshold" className="text-xs text-muted-foreground">
                  Alertar após (minutos offline)
                </Label>
                <Input
                  id="threshold"
                  type="number"
                  min="1"
                  value={alertConfig.offline_threshold_minutes}
                  onChange={(e) => setAlertConfig({ ...alertConfig, offline_threshold_minutes: parseInt(e.target.value) || 5 })}
                  className="mt-1 bg-input border-border text-foreground"
                />
              </div>
              <Button 
                onClick={saveAlertConfig} 
                disabled={loading}
                className="w-full bg-[#9C1E1E] hover:bg-[#7A1717] text-white"
                size="sm"
              >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* INFORMAÇÕES ADICIONAIS */}
        <Card className="mb-6 !bg-card !border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm !text-card-foreground">Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">AnyDesk ID</p>
                <p className="text-sm font-mono !text-card-foreground">{computer.anydesk_client_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Online-Time</p>
                <p className="text-sm !text-card-foreground">{computer.metadata?.online_time || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Client-Version</p>
                <p className="text-sm !text-card-foreground">{computer.metadata?.version || '7.0.0'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">IP Público</p>
                <p className="text-sm font-mono !text-card-foreground">{computer.metadata?.ip_address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sistema</p>
                <p className="text-sm !text-card-foreground">{computer.metadata?.os || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Condomínio</p>
                <p className="text-sm !text-card-foreground">{computer.condominio_name || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TABS */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3 !bg-muted">
            <TabsTrigger value="info" className="data-[state=active]:!bg-[#9C1E1E] data-[state=active]:!text-white">
              <Info className="h-4 w-4 mr-2" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:!bg-[#9C1E1E] data-[state=active]:!text-white">
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="graficos" className="data-[state=active]:!bg-[#9C1E1E] data-[state=active]:!text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Gráficos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <Card className="!bg-card !border-border">
              <CardHeader>
                <CardTitle className="!text-card-foreground">Resumo Completo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm !text-card-foreground">
                <p><strong>Nome:</strong> {displayName}</p>
                <p><strong>Status:</strong> {computer.status}</p>
                <p><strong>Provedor:</strong> {computer.provider || 'Não identificado'}</p>
                <p><strong>Endereço:</strong> {computer.address || 'Não informado'}</p>
                <p><strong>Total Eventos:</strong> {computer.total_events || 0}</p>
                <p><strong>Quedas:</strong> {computer.offline_count || 0}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <ConnectionTimeline computerId={computer.id} />
          </TabsContent>

          <TabsContent value="graficos" className="mt-4">
            <UptimeChart computerId={computer.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
