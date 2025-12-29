import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  MapPin, 
  Clock, 
  LogOut, 
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Wifi
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

interface MasterSession {
  id: string;
  session_id: string;
  ip_address: string;
  user_agent: string;
  device_type: string;
  browser: string;
  country: string;
  country_code: string;
  city: string;
  last_activity: string;
  created_at: string;
  is_active: boolean;
  platform: string;
}

export const ActiveSessionsManager: React.FC = () => {
  const [sessions, setSessions] = useState<MasterSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [terminatingAll, setTerminatingAll] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      // Pegar o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Pegar o session_id atual do token
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Usar o access_token como identificador da sessão atual
        setCurrentSessionId(session.access_token?.substring(0, 20) || null);
      }

      // Buscar todas as sessões ativas do master
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('Erro ao buscar sessões:', error);
        toast.error('Erro ao carregar sessões');
        return;
      }

      setSessions(data || []);
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      toast.error('Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const terminateSession = async (sessionId: string) => {
    try {
      setTerminatingId(sessionId);
      
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

      toast.success('Sessão encerrada com sucesso');
      fetchSessions();
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      toast.error('Erro ao encerrar sessão');
    } finally {
      setTerminatingId(null);
    }
  };

  const terminateAllOtherSessions = async () => {
    try {
      setTerminatingAll(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Pegar sessão atual para não encerrar ela
      const { data: { session } } = await supabase.auth.getSession();
      const currentToken = session?.access_token?.substring(0, 20);

      // Encerrar todas as sessões exceto a atual
      const sessionsToTerminate = sessions.filter(s => 
        !s.session_id.startsWith(currentToken || 'xxx')
      );

      for (const sess of sessionsToTerminate) {
        await supabase
          .from('user_sessions')
          .update({
            is_active: false,
            terminated_at: new Date().toISOString(),
            terminated_by: user.id
          })
          .eq('id', sess.id);
      }

      toast.success(`${sessionsToTerminate.length} sessões encerradas`);
      fetchSessions();
    } catch (error) {
      console.error('Erro ao encerrar sessões:', error);
      toast.error('Erro ao encerrar sessões');
    } finally {
      setTerminatingAll(false);
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

  const isCurrentSession = (session: MasterSession) => {
    return currentSessionId && session.session_id.startsWith(currentSessionId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Sessões Ativas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Sessões Ativas
            </CardTitle>
            <CardDescription>
              Gerencie os dispositivos conectados à sua conta
            </CardDescription>
          </div>
          
          {sessions.length > 1 && (
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
                  Encerrar Todas as Outras
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Encerrar Todas as Sessões?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá desconectar todos os outros dispositivos. Você permanecerá conectado apenas neste dispositivo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={terminateAllOtherSessions}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, Encerrar Todas
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="max-h-[400px]">
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma sessão ativa encontrada</p>
            </div>
          ) : (
            <div className="divide-y">
              {sessions.map((session) => (
                <div 
                  key={session.id} 
                  className={`p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors ${
                    isCurrentSession(session) ? 'bg-primary/5' : ''
                  }`}
                >
                  {/* Ícone do dispositivo */}
                  <div className={`p-3 rounded-lg ${
                    isCurrentSession(session) 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {getDeviceIcon(session.device_type)}
                  </div>

                  {/* Informações principais */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        {session.browser || 'Navegador Desconhecido'}
                      </span>
                      {session.platform && (
                        <span className="text-sm text-muted-foreground">
                          • {session.platform}
                        </span>
                      )}
                      {isCurrentSession(session) && (
                        <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Esta sessão
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="text-lg">{getCountryFlag(session.country_code)}</span>
                        {session.city !== 'Unknown' && session.city ? session.city : session.country}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Wifi className="h-3 w-3" />
                        {session.ip_address}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(session.last_activity), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Botão de encerrar */}
                  {!isCurrentSession(session) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={terminatingId === session.id}
                        >
                          {terminatingId === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Encerrar esta sessão?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O dispositivo será desconectado imediatamente. Se for você, precisará fazer login novamente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => terminateSession(session.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Encerrar Sessão
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
