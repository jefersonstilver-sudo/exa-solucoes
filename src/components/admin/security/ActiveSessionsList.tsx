import { Globe, Monitor, Smartphone, Tablet, Shield, Wifi, HardDrive, Cpu, Clock, MapPin, Languages, Chrome } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ActiveSession } from '@/hooks/useActiveUsers';

interface ActiveSessionsListProps {
  sessions: ActiveSession[];
}

export const ActiveSessionsList = ({ sessions }: ActiveSessionsListProps) => {
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  // Converte código de país em emoji de bandeira
  const getCountryFlag = (countryCode: string) => {
    if (!countryCode || countryCode === 'XX' || countryCode.length !== 2) {
      return '🌍'; // Globo para desconhecido
    }
    // Converte para emoji de bandeira (região indicators)
    const codePoints = [...countryCode.toUpperCase()]
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <Card className="h-[700px] flex flex-col shadow-lg border-2">
      <CardHeader className="flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <span className="flex-1">Sessões Ativas em Tempo Real</span>
          <Badge variant="secondary" className="ml-auto font-semibold px-3 py-1">
            {sessions.length} {sessions.length === 1 ? 'usuário' : 'usuários'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 md:px-6">
          <div className="space-y-3 py-4">
            {sessions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="w-20 h-20 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                  <Globe className="h-10 w-10 opacity-50" />
                </div>
                <p className="font-semibold text-lg mb-1">Nenhuma sessão ativa</p>
                <p className="text-sm">Aguardando conexões de usuários...</p>
              </div>
            ) : (
              sessions.map((session: any) => (
                <div
                  key={session.id}
                  className="p-3 md:p-4 rounded-xl border-2 bg-gradient-to-br from-card to-card/50 hover:border-primary/50 hover:shadow-lg hover:scale-[1.01] transition-all duration-200"
                >
                  {/* Header da Sessão com bandeira e informações do usuário */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 md:gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center text-3xl md:text-4xl border border-primary/20 shadow-sm">
                        {getCountryFlag(session.country_code)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm md:text-base truncate">
                          {session.user_name || (session.user_id ? '👤 Usuário do Sistema' : '🌐 Visitante Anônimo')}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {session.user_email || (session.user_id ? 'Email não disponível' : 'Não autenticado')}
                        </div>
                        {session.user_id && (
                          <div className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                            ID: {session.user_id.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 justify-end flex-shrink-0">
                      {session.user_id && (
                        <Badge variant="default" className="text-xs gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                          <Shield className="h-3 w-3" />
                          Autenticado
                        </Badge>
                      )}
                      {session.is_vpn && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <Shield className="h-3 w-3" />
                          VPN
                        </Badge>
                      )}
                      {session.country_code !== 'BR' && session.country_code !== 'XX' && (
                        <Badge variant="secondary" className="text-xs gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                          <Globe className="h-3 w-3" />
                          Internacional
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Localização */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="font-medium">Localização</span>
                      </div>
                      <div className="text-sm pl-4.5">
                        {session.city !== 'Unknown' && session.city ? session.city : '?'}, 
                        {session.region !== 'Unknown' && session.region ? ` ${session.region}` : ' ?'}
                        <div className="text-xs text-muted-foreground">
                          {session.country !== 'Unknown' ? session.country : 'Desconhecido'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Wifi className="h-3 w-3" />
                        <span className="font-medium">Rede</span>
                      </div>
                      <div className="text-sm pl-4.5">
                        IP: {session.ip_address}
                        {session.isp && (
                          <div className="text-xs text-muted-foreground truncate" title={session.isp}>
                            {session.isp}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dispositivo e Sistema */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {getDeviceIcon(session.device_type)}
                        <span className="font-medium">Dispositivo</span>
                      </div>
                      <div className="text-sm pl-4.5">
                        {session.browser} • {session.device_type}
                        {session.platform && (
                          <div className="text-xs text-muted-foreground">{session.platform}</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Monitor className="h-3 w-3" />
                        <span className="font-medium">Tela</span>
                      </div>
                      <div className="text-sm pl-4.5">
                        {session.screen_width && session.screen_height 
                          ? `${session.screen_width}×${session.screen_height}`
                          : 'Desconhecido'}
                        {session.pixel_ratio && (
                          <div className="text-xs text-muted-foreground">
                            DPR: {session.pixel_ratio}×
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hardware e Localidade */}
                  {(session.cpu_cores || session.device_memory || session.timezone || session.language) && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {(session.cpu_cores || session.device_memory) && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Cpu className="h-3 w-3" />
                            <span className="font-medium">Hardware</span>
                          </div>
                          <div className="text-sm pl-4.5">
                            {session.cpu_cores && <div>{session.cpu_cores} CPU cores</div>}
                            {session.device_memory && (
                              <div className="text-xs text-muted-foreground">{session.device_memory} GB RAM</div>
                            )}
                          </div>
                        </div>
                      )}

                      {(session.timezone || session.language) && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Languages className="h-3 w-3" />
                            <span className="font-medium">Localidade</span>
                          </div>
                          <div className="text-sm pl-4.5">
                            {session.timezone && (
                              <div className="text-xs">{session.timezone}</div>
                            )}
                            {session.language && (
                              <div className="text-xs text-muted-foreground">{session.language}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator className="my-2" />

                  {/* Footer - Atividade */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>
                        Ativo{' '}
                        {formatDistanceToNow(new Date(session.last_activity), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                    
                    {session.asn && (
                      <div className="text-xs opacity-50" title="Autonomous System Number">
                        ASN: {session.asn}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
