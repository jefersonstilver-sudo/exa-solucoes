import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { DashboardMobile } from '../components/dashboard/DashboardMobile';
import { useSidebarContext } from '../context/SidebarContext';
import { 
  Monitor, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  MessageSquare,
  Bell,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useRealTimeCounter } from '../hooks/useRealTimeCounter';
import { StatCard } from '../components/StatCard';
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
        <div className="flex-1">
          <h4 className="font-semibold text-module-primary">
            {device.comments || device.anydesk_client_id}
          </h4>
          <p className="text-xs text-module-secondary">{device.provider}</p>
          {device.address && (
            <p className="text-xs text-module-tertiary mt-1">{device.address}</p>
          )}
        </div>
        <Badge variant="destructive" className="animate-pulse">
          Offline
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-module-secondary">
        <Clock className="w-4 h-4" />
        <span className="font-mono">{elapsed}</span>
      </div>
      
      {device.offline_count > 0 && (
        <p className="text-xs text-module-tertiary mt-2">
          {device.offline_count} queda{device.offline_count > 1 ? 's' : ''} registrada{device.offline_count > 1 ? 's' : ''}
        </p>
      )}
    </Card>
  );
};

export const DashboardUnificado = () => {
  const isMobile = useIsMobile();
  const { setSidebarOpen } = useSidebarContext();
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

      // Dispositivos offline críticos (ordenar por mais quedas)
      const criticalOffline = (devices || [])
        .filter(d => d.status === 'offline')
        .sort((a, b) => (b.offline_count || 0) - (a.offline_count || 0))
        .slice(0, 6) as OfflineDevice[];

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

      // Buscar top 3 conversas não respondidas
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, contact_name, contact_phone, agent_key, last_message_at, is_critical, is_hot_lead')
        .eq('awaiting_response', true)
        .order('last_message_at', { ascending: false })
        .limit(3);

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
    
    // Auto-refresh a cada 10 segundos
    const interval = setInterval(fetchDashboardData, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Renderizar versão mobile
  if (isMobile) {
    return <DashboardMobile onMenuClick={() => setSidebarOpen(true)} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9C1E1E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Dashboard Unificado
            </h1>
            <p className="text-muted-foreground">
              Visão geral completa: Painéis, CRM e Alertas
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Última atualização: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
            </p>
          </div>
          <Button onClick={fetchDashboardData} variant="outline">
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Painéis Online"
          value={metrics.panels_online}
          icon={CheckCircle2}
          iconColor="text-green-500"
        />
        <StatCard
          title="Painéis Offline"
          value={metrics.panels_offline}
          icon={AlertTriangle}
          iconColor="text-red-500"
        />
        <StatCard
          title="Total de Painéis"
          value={metrics.panels_total}
          icon={Monitor}
          iconColor="text-[#9C1E1E]"
        />
        <StatCard
          title="Mensagens Não Lidas"
          value={metrics.unread_messages}
          icon={MessageSquare}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Alertas Críticos"
          value={metrics.critical_alerts}
          icon={Bell}
          iconColor="text-orange-500"
        />
        <StatCard
          title="Eventos Hoje"
          value={metrics.events_today}
          icon={Activity}
          iconColor="text-purple-500"
        />
      </div>

      {/* Painéis Críticos Offline */}
      {offlineDevices.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-foreground">
                Painéis Críticos - Offline Agora
              </h2>
            </div>
            <Link to="/admin/monitoramento-ia/paineis">
              <Button variant="ghost" size="sm">
                Ver Todos <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {offlineDevices.map(device => (
              <OfflinePanelCard key={device.id} device={device} />
            ))}
          </div>
        </div>
      )}

      {/* Preview do CRM */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold text-foreground">
              Conversas Recentes - Aguardando Resposta
            </h2>
          </div>
          <Link to="/admin/monitoramento-ia/crm">
            <Button variant="ghost" size="sm">
              Abrir CRM <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {recentConversations.length === 0 ? (
          <p className="text-module-secondary text-center py-8">
            Nenhuma conversa aguardando resposta
          </p>
        ) : (
          <div className="space-y-3">
            {recentConversations.map(conv => (
              <Link 
                key={conv.id} 
                to={`/admin/monitoramento-ia/crm?conversation=${conv.id}`}
                className="block"
              >
                <Card className="p-4 hover:bg-module-hover transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-module-primary">
                          {conv.contact_name}
                        </h4>
                        {conv.is_hot_lead && (
                          <Badge className="bg-orange-500 text-white">Hot Lead</Badge>
                        )}
                        {conv.is_critical && (
                          <Badge variant="destructive">Crítico</Badge>
                        )}
                      </div>
                      <p className="text-xs text-module-secondary mt-1">
                        {conv.contact_phone} • Agente: {conv.agent_key}
                      </p>
                    </div>
                    <p className="text-xs text-module-tertiary">
                      {format(new Date(conv.last_message_at), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Link Rápido para Monitoramento Completo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/admin/monitoramento-ia/paineis">
          <Card className="p-6 hover:bg-module-hover transition-colors cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-[#9C1E1E]/10">
                  <Monitor className="w-6 h-6 text-[#9C1E1E]" />
                </div>
                <div>
                  <h3 className="font-bold text-module-primary">Monitoramento de Painéis</h3>
                  <p className="text-sm text-module-secondary">Acesse todos os detalhes técnicos</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-module-tertiary group-hover:text-module-primary transition-colors" />
            </div>
          </Card>
        </Link>

        <Link to="/admin/monitoramento-ia/alertas">
          <Card className="p-6 hover:bg-module-hover transition-colors cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Bell className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-module-primary">Alertas e Notificações</h3>
                  <p className="text-sm text-module-secondary">Gerencie todos os alertas</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-module-tertiary group-hover:text-module-primary transition-colors" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};
