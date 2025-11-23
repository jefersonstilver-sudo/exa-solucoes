import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const displayName = computer.comments || computer.name || computer.hostname;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto glass-card border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Monitor className="h-6 w-6 text-primary" />
            <span className="text-primary">{displayName}</span>
          </DialogTitle>
        </DialogHeader>

        {/* 3 CARDS SUPERIORES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* CARD 1: INFORMAÇÕES DO SISTEMA */}
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Local/Prédio
                </p>
                <p className="text-base font-semibold text-primary">{displayName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Provedor
                </p>
                <Badge variant="outline" className="bg-module-input/50">
                  {computer.provider || 'Sem provedor'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Endereço</p>
                <p className="text-sm">{computer.address || 'Sem endereço'}</p>
              </div>
              {computer.tags && Array.isArray(computer.tags) && computer.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {computer.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD 2: ATIVIDADE */}
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
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
                      ? "bg-green-500/20 text-green-400 border-green-500/30" 
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  )}
                >
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Última Conexão</p>
                <p className="text-sm font-semibold">
                  {computer.status === 'offline' ? (
                    <span className="text-red-400">Offline há {offlineCounter}</span>
                  ) : (
                    <span className="text-green-400">Online agora</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total de Eventos</p>
                <p className="text-2xl font-bold">{computer.total_events || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-red-400" />
                  Quedas
                </p>
                <p className="text-2xl font-bold text-red-400">{computer.offline_count || 0}</p>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: CONFIGURAÇÃO DE ALERTAS */}
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="alerts-enabled" className="text-sm">Alertas Automáticos</Label>
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
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={saveAlertConfig} 
                disabled={loading}
                className="w-full"
                size="sm"
              >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* INFORMAÇÕES ADICIONAIS */}
        <Card className="glass-card border-white/10 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">AnyDesk ID</p>
                <p className="text-sm font-mono">{computer.anydesk_client_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Online-Time</p>
                <p className="text-sm">{computer.metadata?.online_time || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Client-Version</p>
                <p className="text-sm">{computer.metadata?.version || '7.0.0'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">IP Público</p>
                <p className="text-sm font-mono">{computer.metadata?.ip_address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sistema</p>
                <p className="text-sm">{computer.metadata?.os || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Condomínio</p>
                <p className="text-sm">{computer.condominio_name || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TABS */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-module-input">
            <TabsTrigger value="info" className="data-[state=active]:bg-primary">
              <Info className="h-4 w-4 mr-2" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-primary">
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="graficos" className="data-[state=active]:bg-primary">
              <BarChart3 className="h-4 w-4 mr-2" />
              Gráficos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle>Resumo Completo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
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
