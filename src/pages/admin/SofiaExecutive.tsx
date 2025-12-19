import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  Shield, 
  Activity, 
  RefreshCw, 
  Settings, 
  History,
  Flame,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  User,
  Search,
  Mic
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminSession {
  id: string;
  user_phone: string;
  user_name: string;
  code_sent_at: string;
  code_verified_at: string | null;
  session_active: boolean;
  session_expires_at: string | null;
  created_at: string;
}

interface AccessLog {
  id: string;
  session_id: string;
  query_type: string;
  query_params: any;
  response_summary: string;
  duration_ms: number;
  created_at: string;
}

interface HeatMetric {
  id: string;
  conversation_id: string;
  heat_score: number;
  risk_level: string;
  risk_factors: any;
  message_count: number;
  days_without_response: number;
  last_calculated_at: string;
}

export default function SofiaExecutive() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [heatMetrics, setHeatMetrics] = useState<HeatMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [agentStatus, setAgentStatus] = useState<any>(null);
  const [needsConfiguration, setNeedsConfiguration] = useState(false);
  const [autoConfigAttempted, setAutoConfigAttempted] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-configure if needed
  useEffect(() => {
    if (needsConfiguration && !autoConfigAttempted && !isConfiguring) {
      setAutoConfigAttempted(true);
      handleAutoConfiguration();
    }
  }, [needsConfiguration, autoConfigAttempted, isConfiguring]);

  const handleAutoConfiguration = async () => {
    setIsConfiguring(true);
    toast.info('Configurando Sofia automaticamente...', { duration: 3000 });
    
    try {
      const { data, error } = await supabase.functions.invoke('configure-sofia-agent', {
        body: { action: 'configure' }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Sofia configurada automaticamente!');
        setAgentStatus(data.details);
        setNeedsConfiguration(false);
      } else {
        toast.error(data?.message || 'Falha na auto-configuração');
      }
    } catch (error: any) {
      console.error('Auto-configure error:', error);
      toast.error('Erro na auto-configuração. Configure manualmente.');
    } finally {
      setIsConfiguring(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load admin sessions
      const { data: sessionsData } = await supabase
        .from('sofia_admin_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      setSessions(sessionsData || []);

      // Load access logs
      const { data: logsData } = await supabase
        .from('sofia_admin_access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      setAccessLogs(logsData || []);

      // Load heat metrics
      const { data: metricsData } = await supabase
        .from('conversation_heat_metrics')
        .select('*')
        .order('heat_score', { ascending: false })
        .limit(20);
      
      setHeatMetrics(metricsData || []);

      // Check agent status
      try {
        const { data: statusData, error: statusError } = await supabase.functions.invoke('configure-sofia-agent', {
          body: { action: 'status' }
        });
        
        if (statusError) {
          console.error('Status error:', statusError);
          setNeedsConfiguration(true);
        } else if (statusData) {
          setAgentStatus(statusData);
          
          // Check if required tools are configured
          const tools = statusData.tools || [];
          const hasConsultarSistema = tools.includes('consultar_sistema');
          const hasAdminAuth = tools.includes('admin_auth');
          
          if (!hasConsultarSistema || !hasAdminAuth) {
            setNeedsConfiguration(true);
          } else {
            setNeedsConfiguration(false);
          }
        } else {
          setNeedsConfiguration(true);
        }
      } catch (e) {
        console.error('Could not fetch agent status:', e);
        setNeedsConfiguration(true);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigureAgent = async () => {
    setIsConfiguring(true);
    try {
      const { data, error } = await supabase.functions.invoke('configure-sofia-agent', {
        body: { action: 'configure' }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Sofia configurada com sucesso!');
        setAgentStatus(data.details);
        setNeedsConfiguration(false);
      } else {
        toast.error(data?.message || 'Erro ao configurar');
      }
    } catch (error: any) {
      console.error('Error configuring agent:', error);
      toast.error('Erro ao configurar agente');
    } finally {
      setIsConfiguring(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'hot': return 'bg-red-500';
      case 'warm': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      case 'cold': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getRiskLevelLabel = (level: string) => {
    switch (level) {
      case 'hot': return 'Quente';
      case 'warm': return 'Morno';
      case 'medium': return 'Médio';
      case 'low': return 'Baixo';
      case 'cold': return 'Frio';
      default: return level;
    }
  };

  const activeSessionsCount = sessions.filter(s => s.session_active).length;
  const totalQueries = accessLogs.length;
  const hotConversations = heatMetrics.filter(m => m.risk_level === 'hot').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sofia Executive</h1>
            <p className="text-muted-foreground">Painel de controle do Modo Gerente Master</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleConfigureAgent} disabled={isConfiguring}>
            <Settings className={`h-4 w-4 mr-2 ${isConfiguring ? 'animate-spin' : ''}`} />
            {isConfiguring ? 'Configurando...' : 'Reconfigurar Sofia'}
          </Button>
        </div>
      </div>

      {/* Configuration Warning Banner */}
      {needsConfiguration && !isConfiguring && (
        <Card className="border-orange-500 bg-orange-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-orange-700 dark:text-orange-300">Sofia precisa ser configurada</p>
                  <p className="text-sm text-muted-foreground">
                    As ferramentas admin_auth e consultar_sistema não estão configuradas no agente ElevenLabs.
                    {autoConfigAttempted && ' A auto-configuração falhou. Configure manualmente.'}
                  </p>
                </div>
              </div>
              <Button onClick={handleConfigureAgent} disabled={isConfiguring} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-500/20">
                <Settings className="h-4 w-4 mr-2" />
                Configurar Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessões Ativas</p>
                <p className="text-2xl font-bold">{activeSessionsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Search className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Consultas Realizadas</p>
                <p className="text-2xl font-bold">{totalQueries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Flame className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversas Quentes</p>
                <p className="text-2xl font-bold">{hotConversations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Mic className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status ElevenLabs</p>
                <p className="text-sm font-medium">
                  {agentStatus?.name || 'Não configurado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Status Card */}
      {agentStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status do Agente ElevenLabs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ID do Agente</p>
                <p className="font-mono text-sm">{agentStatus.id?.substring(0, 12)}...</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{agentStatus.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Idioma</p>
                <p className="font-medium">{agentStatus.language || 'pt'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ferramentas</p>
                <div className="flex gap-1 flex-wrap">
                  {agentStatus.tools?.map((tool: string) => (
                    <Badge key={tool} variant="secondary" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList>
          <TabsTrigger value="sessions">
            <Shield className="h-4 w-4 mr-2" />
            Sessões Admin
          </TabsTrigger>
          <TabsTrigger value="logs">
            <History className="h-4 w-4 mr-2" />
            Logs de Acesso
          </TabsTrigger>
          <TabsTrigger value="heat">
            <Flame className="h-4 w-4 mr-2" />
            Métricas de Calor
          </TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Sessões Administrativas</CardTitle>
              <CardDescription>Histórico de autenticações no Modo Gerente Master</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {sessions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma sessão registrada ainda
                    </p>
                  ) : (
                    sessions.map(session => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${session.session_active ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                            <User className={`h-4 w-4 ${session.session_active ? 'text-green-500' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <p className="font-medium">{session.user_name || 'Admin'}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {session.user_phone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={session.session_active ? 'default' : 'secondary'}>
                            {session.session_active ? 'Ativa' : session.code_verified_at ? 'Encerrada' : 'Não verificada'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(session.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Consultas</CardTitle>
              <CardDescription>Auditoria de todas as consultas realizadas no modo admin</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {accessLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma consulta registrada ainda
                    </p>
                  ) : (
                    accessLogs.map(log => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Search className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{log.query_type}</p>
                            <p className="text-xs text-muted-foreground max-w-md truncate">
                              {log.response_summary}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="font-mono">
                            {log.duration_ms}ms
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(log.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heat Metrics Tab */}
        <TabsContent value="heat">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Calor das Conversas</CardTitle>
              <CardDescription>Análise automática de engajamento e risco</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {heatMetrics.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma métrica calculada ainda. As métricas são atualizadas automaticamente quando mensagens são recebidas.
                    </p>
                  ) : (
                    heatMetrics.map(metric => (
                      <div
                        key={metric.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-full ${getRiskLevelColor(metric.risk_level)} flex items-center justify-center`}>
                              <span className="text-white font-bold">{metric.heat_score}</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={getRiskLevelColor(metric.risk_level)}>
                                {getRiskLevelLabel(metric.risk_level)}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {metric.message_count} mensagens
                              </span>
                            </div>
                            {metric.days_without_response > 0 && (
                              <p className="text-sm text-orange-500 flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                {metric.days_without_response} dias sem resposta
                              </p>
                            )}
                            {Array.isArray(metric.risk_factors) && metric.risk_factors.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {metric.risk_factors.map((factor, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {factor}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Atualizado: {format(new Date(metric.last_calculated_at), "dd/MM HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
