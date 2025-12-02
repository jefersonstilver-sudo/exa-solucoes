import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Monitor, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  MessageSquare,
  Bell,
  Clock,
  Menu,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useRealTimeCounter } from '../../hooks/useRealTimeCounter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardMetrics {
  panels_online: number;
  panels_offline: number;
  panels_total: number;
  unread_messages: number;
  critical_alerts: number;
  events_today: number;
}

interface OfflineDevice {
  id: string;
  anydesk_client_id: string;
  comments: string;
  provider: string;
  address: string;
  last_online_at: string;
  offline_count: number;
}

interface RecentConversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  agent_key: string;
  last_message_at: string;
  is_critical: boolean;
  is_hot_lead: boolean;
}

// Componente para card de painel offline com contador
const OfflinePanelCard = ({ device }: { device: OfflineDevice }) => {
  const elapsed = useRealTimeCounter(device.last_online_at);
  
  return (
    <Card className="p-4 border-red-500/50 bg-red-950/20">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-module-primary truncate">
            {device.comments || device.anydesk_client_id}
          </h4>
          <p className="text-xs text-module-secondary truncate">{device.provider}</p>
          {device.address && (
            <p className="text-xs text-module-tertiary mt-1 truncate">{device.address}</p>
          )}
        </div>
        <Badge variant="destructive" className="ml-2 animate-pulse shrink-0">
          Offline
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-module-secondary">
        <Clock className="w-4 h-4 shrink-0" />
        <span className="font-mono text-xs">{elapsed}</span>
      </div>
      
      {device.offline_count > 0 && (
        <p className="text-xs text-module-tertiary mt-2">
          {device.offline_count} queda{device.offline_count > 1 ? 's' : ''}
        </p>
      )}
    </Card>
  );
};

interface DashboardMobileProps {
  onMenuClick: () => void;
}

export const DashboardMobile = ({ onMenuClick }: DashboardMobileProps) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    panels_online: 0,
    panels_offline: 0,
    panels_total: 0,
    unread_messages: 0,
    critical_alerts: 0,
    events_today: 0
  });
  const [offlineDevices, setOfflineDevices] = useState<OfflineDevice[]>([]);
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchDashboardData = async () => {
    try {
      // Buscar métricas dos painéis
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('id, anydesk_client_id, status, comments, provider, address, last_online_at, offline_count');

      if (devicesError) throw devicesError;

      const online = devices?.filter(d => d.status === 'online').length || 0;
      const offline = devices?.filter(d => d.status === 'offline').length || 0;
      const total = devices?.length || 0;

      // Dispositivos offline críticos (top 3 para mobile)
      const criticalOffline = (devices || [])
        .filter(d => d.status === 'offline')
        .sort((a, b) => (b.offline_count || 0) - (a.offline_count || 0))
        .slice(0, 3) as OfflineDevice[];

      setOfflineDevices(criticalOffline);

      // Buscar conversas não lidas
      const { count: unreadCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('awaiting_response', true);

      // Buscar alertas críticos
      const { count: criticalCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('is_critical', true);

      // Buscar eventos de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: eventsCount } = await supabase
        .from('events_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Buscar top 2 conversas não respondidas (mobile)
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, contact_name, contact_phone, agent_key, last_message_at, is_critical, is_hot_lead')
        .eq('awaiting_response', true)
        .order('last_message_at', { ascending: false })
        .limit(2);

      setRecentConversations((conversations || []) as RecentConversation[]);

      setMetrics({
        panels_online: online,
        panels_offline: offline,
        panels_total: total,
        unread_messages: unreadCount || 0,
        critical_alerts: criticalCount || 0,
        events_today: eventsCount || 0
      });

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar métricas do dashboard:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh a cada 30 segundos no mobile
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[100dvh] flex flex-col fixed inset-0 z-50 bg-background overflow-hidden">
      {/* Header mobile */}
      <header className="bg-[#9C1E1E] pt-safe sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onMenuClick}
            className="text-white hover:bg-white/10"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-white font-semibold text-lg">Dashboard</h1>
            <p className="text-white/70 text-xs">
              {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={fetchDashboardData}
            className="text-white hover:bg-white/10"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-auto custom-scrollbar pb-safe">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9C1E1E]"></div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Cards de métricas em grid 2x3 */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-green-500/10 border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-xs text-module-secondary">Online</span>
                </div>
                <p className="text-2xl font-bold text-module-primary">{metrics.panels_online}</p>
              </Card>

              <Card className="p-4 bg-red-500/10 border-red-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <span className="text-xs text-module-secondary">Offline</span>
                </div>
                <p className="text-2xl font-bold text-module-primary">{metrics.panels_offline}</p>
              </Card>

              <Card className="p-4 bg-blue-500/10 border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-blue-500 shrink-0" />
                  <span className="text-xs text-module-secondary">Mensagens</span>
                </div>
                <p className="text-2xl font-bold text-module-primary">{metrics.unread_messages}</p>
              </Card>

              <Card className="p-4 bg-orange-500/10 border-orange-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-5 h-5 text-orange-500 shrink-0" />
                  <span className="text-xs text-module-secondary">Alertas</span>
                </div>
                <p className="text-2xl font-bold text-module-primary">{metrics.critical_alerts}</p>
              </Card>

              <Card className="p-4 bg-[#9C1E1E]/10 border-[#9C1E1E]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="w-5 h-5 text-[#9C1E1E] shrink-0" />
                  <span className="text-xs text-module-secondary">Total</span>
                </div>
                <p className="text-2xl font-bold text-module-primary">{metrics.panels_total}</p>
              </Card>

              <Card className="p-4 bg-purple-500/10 border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-purple-500 shrink-0" />
                  <span className="text-xs text-module-secondary">Eventos</span>
                </div>
                <p className="text-2xl font-bold text-module-primary">{metrics.events_today}</p>
              </Card>
            </div>

            {/* Painéis Críticos Offline */}
            {offlineDevices.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    <h2 className="font-bold text-module-primary">Painéis Offline</h2>
                  </div>
                  <Link to="/admin/monitoramento-ia/paineis">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Ver Todos
                    </Button>
                  </Link>
                </div>
                
                <div className="space-y-2">
                  {offlineDevices.map(device => (
                    <OfflinePanelCard key={device.id} device={device} />
                  ))}
                </div>
              </div>
            )}

            {/* Preview do CRM */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500 shrink-0" />
                  <h2 className="font-bold text-module-primary">Conversas Recentes</h2>
                </div>
                <Link to="/admin/monitoramento-ia/crm">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Abrir CRM
                  </Button>
                </Link>
              </div>

              {recentConversations.length === 0 ? (
                <Card className="p-6">
                  <p className="text-module-secondary text-center text-sm">
                    Nenhuma conversa aguardando resposta
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {recentConversations.map(conv => (
                    <Link 
                      key={conv.id} 
                      to={`/admin/monitoramento-ia/crm?conversation=${conv.id}`}
                    >
                      <Card className="p-4 active:bg-module-hover">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold text-module-primary truncate">
                                {conv.contact_name}
                              </h4>
                              {conv.is_hot_lead && (
                                <Badge className="bg-orange-500 text-white text-xs shrink-0">Hot</Badge>
                              )}
                              {conv.is_critical && (
                                <Badge variant="destructive" className="text-xs shrink-0">Crítico</Badge>
                              )}
                            </div>
                            <p className="text-xs text-module-secondary truncate">
                              {conv.contact_phone}
                            </p>
                          </div>
                          <p className="text-xs text-module-tertiary shrink-0">
                            {format(new Date(conv.last_message_at), "dd/MM HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Links Rápidos */}
            <div className="grid grid-cols-1 gap-3 pb-4">
              <Link to="/admin/monitoramento-ia/paineis">
                <Card className="p-4 active:bg-module-hover">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#9C1E1E]/10">
                        <Monitor className="w-5 h-5 text-[#9C1E1E]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-module-primary text-sm">Monitoramento</h3>
                        <p className="text-xs text-module-secondary">Detalhes técnicos</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-module-tertiary" />
                  </div>
                </Card>
              </Link>

              <Link to="/admin/monitoramento-ia/alertas">
                <Card className="p-4 active:bg-module-hover">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <Bell className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-module-primary text-sm">Alertas</h3>
                        <p className="text-xs text-module-secondary">Notificações</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-module-tertiary" />
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
