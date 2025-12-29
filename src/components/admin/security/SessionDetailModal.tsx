import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  Clock,
  Cpu,
  HardDrive,
  ScreenShare,
  Link2,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  History,
  MousePointer,
  ArrowUpDown,
  LogOut,
  Loader2,
  Calendar,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SessionData {
  id: string;
  session_id: string;
  ip_address: string;
  user_agent: string;
  device_type: string;
  browser: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  last_activity: string;
  created_at: string;
  is_active: boolean;
  platform: string;
  timezone: string;
  language: string;
  screen_width: number;
  screen_height: number;
  pixel_ratio: number;
  cpu_cores: number;
  device_memory: number;
  isp: string;
  asn: string;
  org: string;
  is_vpn: boolean;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  latitude: number;
  longitude: number;
}

interface NavigationEntry {
  id: string;
  path: string;
  page_title: string;
  action_type: string;
  time_spent_seconds: number;
  scroll_depth: number;
  clicks_count: number;
  created_at: string;
}

interface SessionDetailModalProps {
  session: SessionData | null;
  isOpen: boolean;
  onClose: () => void;
  onTerminate: (sessionId: string) => Promise<void>;
  isCurrentSession: boolean;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  isOpen,
  onClose,
  onTerminate,
  isCurrentSession,
}) => {
  const [navigationHistory, setNavigationHistory] = useState<NavigationEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [terminating, setTerminating] = useState(false);

  // Carregar histórico de navegação
  useEffect(() => {
    if (session?.session_id && isOpen) {
      loadNavigationHistory();
    }
  }, [session?.session_id, isOpen]);

  const loadNavigationHistory = async () => {
    if (!session?.session_id) return;
    
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('session_navigation_history')
        .select('*')
        .eq('session_id', session.session_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setNavigationHistory(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTerminate = async () => {
    if (!session) return;
    setTerminating(true);
    try {
      await onTerminate(session.id);
      onClose();
    } finally {
      setTerminating(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getCountryFlag = (countryCode: string) => {
    if (!countryCode || countryCode === 'XX' || countryCode.length !== 2) {
      return '🌍';
    }
    try {
      const code = countryCode.toUpperCase();
      const codePoints = [...code].map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌍';
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      page_view: { label: 'Visualizou', color: 'bg-blue-500/20 text-blue-400' },
      page_exit: { label: 'Saiu', color: 'bg-gray-500/20 text-gray-400' },
      page_unload: { label: 'Fechou', color: 'bg-red-500/20 text-red-400' },
      click: { label: 'Clicou', color: 'bg-green-500/20 text-green-400' },
      login: { label: 'Login', color: 'bg-primary/20 text-primary' },
      logout: { label: 'Logout', color: 'bg-orange-500/20 text-orange-400' },
    };
    return labels[actionType] || { label: actionType, color: 'bg-muted text-muted-foreground' };
  };

  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isCurrentSession ? 'bg-primary/20 text-primary' : 'bg-muted'}`}>
              {getDeviceIcon(session.device_type)}
            </div>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                Detalhes da Sessão
                {isCurrentSession && (
                  <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                    Este dispositivo
                  </Badge>
                )}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {session.browser} • {session.platform}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger
              value="details"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4"
            >
              <Monitor className="h-4 w-4 mr-2" />
              Dispositivo
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4"
            >
              <History className="h-4 w-4 mr-2" />
              Histórico ({navigationHistory.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            <TabsContent value="details" className="m-0 p-6 space-y-6">
              {/* Dispositivo */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Dispositivo
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem
                    icon={<Globe className="h-4 w-4" />}
                    label="Navegador"
                    value={`${session.browser || 'Desconhecido'} • ${session.platform || '-'}`}
                  />
                  <InfoItem
                    icon={<ScreenShare className="h-4 w-4" />}
                    label="Resolução"
                    value={session.screen_width && session.screen_height
                      ? `${session.screen_width}x${session.screen_height} @${session.pixel_ratio || 1}x`
                      : '-'}
                  />
                  <InfoItem
                    icon={<Cpu className="h-4 w-4" />}
                    label="CPU"
                    value={session.cpu_cores ? `${session.cpu_cores} cores` : '-'}
                  />
                  <InfoItem
                    icon={<HardDrive className="h-4 w-4" />}
                    label="Memória"
                    value={session.device_memory ? `${session.device_memory} GB` : '-'}
                  />
                </div>
              </div>

              <Separator />

              {/* Localização */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localização
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem
                    icon={<span className="text-lg">{getCountryFlag(session.country_code)}</span>}
                    label="Local"
                    value={[session.city, session.region, session.country].filter(Boolean).join(', ') || '-'}
                  />
                  <InfoItem
                    icon={<Wifi className="h-4 w-4" />}
                    label="IP"
                    value={session.ip_address || '-'}
                  />
                  <InfoItem
                    icon={<Globe className="h-4 w-4" />}
                    label="ISP"
                    value={session.isp || '-'}
                  />
                  <InfoItem
                    icon={<Clock className="h-4 w-4" />}
                    label="Timezone"
                    value={session.timezone || '-'}
                  />
                  <InfoItem
                    icon={session.is_vpn ? <ShieldAlert className="h-4 w-4 text-destructive" /> : <ShieldCheck className="h-4 w-4 text-green-500" />}
                    label="VPN/Proxy"
                    value={session.is_vpn ? 'Detectado' : 'Não detectado'}
                    valueClass={session.is_vpn ? 'text-destructive' : 'text-green-500'}
                  />
                  {session.latitude && session.longitude && (
                    <InfoItem
                      icon={<MapPin className="h-4 w-4" />}
                      label="Coordenadas"
                      value={`${session.latitude.toFixed(4)}, ${session.longitude.toFixed(4)}`}
                    />
                  )}
                </div>
              </div>

              <Separator />

              {/* Origem */}
              {(session.referrer || session.utm_source) && (
                <>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Origem
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {session.referrer && (
                        <InfoItem
                          icon={<Link2 className="h-4 w-4" />}
                          label="Referrer"
                          value={session.referrer}
                        />
                      )}
                      {session.utm_source && (
                        <InfoItem
                          icon={<Globe className="h-4 w-4" />}
                          label="UTM"
                          value={`${session.utm_source}${session.utm_medium ? ` / ${session.utm_medium}` : ''}`}
                        />
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Sessão */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Sessão
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem
                    icon={<Clock className="h-4 w-4" />}
                    label="Iniciada em"
                    value={session.created_at 
                      ? format(new Date(session.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : '-'}
                  />
                  <InfoItem
                    icon={<Clock className="h-4 w-4" />}
                    label="Última atividade"
                    value={session.last_activity
                      ? formatDistanceToNow(new Date(session.last_activity), { addSuffix: true, locale: ptBR })
                      : '-'}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="m-0 p-0">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : navigationHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mb-4 opacity-30" />
                  <p>Nenhum histórico de navegação</p>
                </div>
              ) : (
                <div className="divide-y">
                  {navigationHistory.map((entry) => {
                    const actionInfo = getActionTypeLabel(entry.action_type);
                    return (
                      <div key={entry.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                            {format(new Date(entry.created_at), 'HH:mm:ss')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`text-xs ${actionInfo.color}`}>
                                {actionInfo.label}
                              </Badge>
                              <span className="font-medium truncate">
                                {entry.page_title || entry.path}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="truncate">{entry.path}</span>
                              {entry.time_spent_seconds > 0 && (
                                <span className="flex items-center gap-1 shrink-0">
                                  <Clock className="h-3 w-3" />
                                  {entry.time_spent_seconds}s
                                </span>
                              )}
                              {entry.clicks_count > 0 && (
                                <span className="flex items-center gap-1 shrink-0">
                                  <MousePointer className="h-3 w-3" />
                                  {entry.clicks_count}
                                </span>
                              )}
                              {entry.scroll_depth > 0 && (
                                <span className="flex items-center gap-1 shrink-0">
                                  <ArrowUpDown className="h-3 w-3" />
                                  {entry.scroll_depth}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer com botão de encerrar */}
        {!isCurrentSession && (
          <div className="p-4 border-t bg-muted/30">
            <Button
              variant="destructive"
              onClick={handleTerminate}
              disabled={terminating}
              className="w-full"
            >
              {terminating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Encerrar Esta Sessão
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Componente auxiliar para exibir informações
const InfoItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}> = ({ icon, label, value, valueClass }) => (
  <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
    <div className="text-muted-foreground mt-0.5">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium truncate ${valueClass || ''}`}>{value}</p>
    </div>
  </div>
);
