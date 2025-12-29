import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  Clock, 
  LogOut, 
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Wifi,
  ShieldAlert,
  Trash2,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SessionDetailModal } from './SessionDetailModal';
import { getCurrentSessionId } from '@/hooks/useNavigationTracker';

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

const ONLINE_THRESHOLD_MINUTES = 3;

export const ActiveSessionsManager: React.FC = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [terminatingIds, setTerminatingIds] = useState<Set<string>>(new Set());
  const [terminatingAll, setTerminatingAll] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ID da sessão atual do navegador
  const currentBrowserSessionId = useMemo(() => getCurrentSessionId(), []);

  // Buscar sessões
  const fetchSessions = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) throw error;

      // Consolidar sessões duplicadas pelo session_id
      const uniqueSessions = new Map<string, SessionData>();
      (data || []).forEach((session: SessionData) => {
        const existing = uniqueSessions.get(session.session_id);
        if (!existing || new Date(session.last_activity) > new Date(existing.last_activity)) {
          uniqueSessions.set(session.session_id, session);
        }
      });

      setSessions(Array.from(uniqueSessions.values()));
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      toast.error('Erro ao carregar sessões');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(() => fetchSessions(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // Verificar se sessão está online (última atividade < 3 min)
  const isOnlineNow = (lastActivity: string) => {
    const diff = (Date.now() - new Date(lastActivity).getTime()) / 1000 / 60;
    return diff < ONLINE_THRESHOLD_MINUTES;
  };

  // Verificar se é a sessão atual
  const isCurrentSession = (session: SessionData) => {
    return currentBrowserSessionId && session.session_id === currentBrowserSessionId;
  };

  // Ordenar: Online primeiro, depois por última atividade
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      // Sessão atual sempre primeiro
      if (isCurrentSession(a)) return -1;
      if (isCurrentSession(b)) return 1;
      
      // Online antes de offline
      const aOnline = isOnlineNow(a.last_activity);
      const bOnline = isOnlineNow(b.last_activity);
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      
      // Por última atividade (mais recente primeiro)
      return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
    });
  }, [sessions, currentBrowserSessionId]);

  // Sessões selecionáveis (não inclui a atual)
  const selectableSessions = useMemo(() => 
    sortedSessions.filter(s => !isCurrentSession(s)),
    [sortedSessions, currentBrowserSessionId]
  );

  // Handlers de seleção
  const toggleSelection = (sessionId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === selectableSessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableSessions.map(s => s.id)));
    }
  };

  // Encerrar sessão
  const terminateSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    try {
      setTerminatingIds(prev => new Set([...prev, sessionId]));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          terminated_by: user.id
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast.success('Sessão encerrada');
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
      fetchSessions(true);
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      toast.error('Erro ao encerrar sessão');
    } finally {
      setTerminatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
    }
  };

  // Encerrar sessões selecionadas
  const terminateSelected = async () => {
    if (selectedIds.size === 0) return;

    setTerminatingAll(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          terminated_by: user.id
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedIds.size} sessões encerradas`);
      setSelectedIds(new Set());
      fetchSessions(true);
    } catch (error) {
      console.error('Erro ao encerrar sessões:', error);
      toast.error('Erro ao encerrar sessões');
    } finally {
      setTerminatingAll(false);
    }
  };

  // Encerrar todas as outras sessões
  const terminateAllOthers = async () => {
    setTerminatingAll(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Evita listas gigantes na URL ("id in (...)"), que causam 400 Bad Request.
      // Fazemos um UPDATE por filtro, encerrando todas as sessões ativas do usuário,
      // exceto a sessão atual do navegador.
      const baseUpdate = supabase
        .from('user_sessions')
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          terminated_by: user.id,
        })
        .eq('user_id', user.id)
        .eq('is_active', true);

      const { error } = currentBrowserSessionId
        ? await baseUpdate.neq('session_id', currentBrowserSessionId)
        : await baseUpdate;

      if (error) throw error;

      toast.success('Sessões encerradas');
      setSelectedIds(new Set());
      fetchSessions(true);
    } catch (error) {
      console.error('Erro ao encerrar sessões:', error);
      toast.error('Erro ao encerrar sessões');
    } finally {
      setTerminatingAll(false);
    }
  };

  // Ícones e utilitários
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sessões Ativas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Sessões Ativas
                <Badge variant="secondary" className="ml-2">
                  {sessions.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Gerencie os dispositivos conectados à sua conta
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSessions(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              {selectableSessions.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={terminatingAll}
                    >
                      {terminatingAll ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4 mr-2" />
                      )}
                      Encerrar Todas
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Encerrar Todas as Outras Sessões?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso irá desconectar todos os outros dispositivos ({selectableSessions.length}). 
                        Você permanecerá conectado apenas neste dispositivo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={terminateAllOthers}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sim, Encerrar Todas
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Barra de seleção */}
          {selectableSessions.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedIds.size === selectableSessions.length && selectableSessions.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size > 0 
                    ? `${selectedIds.size} selecionada(s)` 
                    : 'Selecionar todas'}
                </span>
              </div>
              
              {selectedIds.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={terminatingAll}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Encerrar ({selectedIds.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Encerrar Sessões Selecionadas?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {selectedIds.size} dispositivo(s) serão desconectados imediatamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={terminateSelected}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Encerrar Selecionadas
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}

          {/* Lista de sessões */}
          <ScrollArea className="h-[400px]">
            {sessions.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nenhuma sessão ativa encontrada</p>
              </div>
            ) : (
              <div className="divide-y">
                {sortedSessions.map((session) => {
                  const isCurrent = isCurrentSession(session);
                  const isOnline = isOnlineNow(session.last_activity);
                  const isTerminating = terminatingIds.has(session.id);
                  const isSelected = selectedIds.has(session.id);

                  return (
                    <div 
                      key={session.id} 
                      className={`p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        isCurrent ? 'bg-primary/5' : ''
                      } ${isSelected ? 'bg-primary/10' : ''}`}
                      onClick={() => {
                        setSelectedSession(session);
                        setShowDetailModal(true);
                      }}
                    >
                      {/* Checkbox (não clicável no item atual) */}
                      {!isCurrent && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelection(session.id)}
                          />
                        </div>
                      )}
                      {isCurrent && <div className="w-4" />}

                      {/* Ícone do dispositivo */}
                      <div className={`p-3 rounded-xl shrink-0 ${
                        isCurrent 
                          ? 'bg-primary/20 text-primary' 
                          : isOnline 
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {getDeviceIcon(session.device_type)}
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold">
                            {session.browser || 'Navegador'}
                          </span>
                          {session.platform && (
                            <span className="text-sm text-muted-foreground">
                              • {session.platform}
                            </span>
                          )}
                          
                          {/* Badges */}
                          {isCurrent && (
                            <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Este dispositivo
                            </Badge>
                          )}
                          {isOnline && !isCurrent && (
                            <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
                              <Radio className="h-3 w-3 mr-1 animate-pulse" />
                              Online
                            </Badge>
                          )}
                          {session.is_vpn && (
                            <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">
                              <ShieldAlert className="h-3 w-3 mr-1" />
                              VPN
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <span className="text-base">{getCountryFlag(session.country_code)}</span>
                            {session.city !== 'Unknown' && session.city 
                              ? `${session.city}, ${session.country}` 
                              : session.country}
                          </span>
                          
                          <span className="flex items-center gap-1">
                            <Wifi className="h-3 w-3" />
                            {session.ip_address}
                          </span>
                          
                          {session.isp && session.isp !== 'Unknown' && (
                            <span className="hidden sm:flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {session.isp}
                            </span>
                          )}
                          
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {isOnline ? (
                              <span className="text-green-500 font-medium">Agora</span>
                            ) : (
                              formatDistanceToNow(new Date(session.last_activity), {
                                addSuffix: true,
                                locale: ptBR
                              })
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Botão de encerrar (individual) */}
                      {!isCurrent && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={isTerminating}
                            onClick={() => terminateSession(session.id)}
                          >
                            {isTerminating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <LogOut className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modal de detalhes */}
      <SessionDetailModal
        session={selectedSession}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedSession(null);
        }}
        onTerminate={terminateSession}
        isCurrentSession={selectedSession ? isCurrentSession(selectedSession) : false}
      />
    </>
  );
};
