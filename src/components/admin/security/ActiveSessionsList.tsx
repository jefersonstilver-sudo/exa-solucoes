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
    <Card className="h-[700px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Sessões Ativas em Tempo Real
          <Badge variant="outline" className="ml-auto">
            {sessions.length} {sessions.length === 1 ? 'usuário' : 'usuários'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6">
          <div className="space-y-4 pb-4">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhuma sessão ativa</p>
                <p className="text-sm">Aguardando conexões...</p>
              </div>
            ) : (
              sessions.map((session: any) => (
                <div
                  key={session.id}
                  className="p-4 rounded-lg border-2 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200"
                >
                  {/* Header da Sessão */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl leading-none">{getCountryFlag(session.country_code)}</span>
                      <div>
                        <div className="font-semibold text-base">
                          {session.user_name || 'Visitante Anônimo'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session.user_email || 'Não autenticado'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 justify-end">
                      {session.is_vpn && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <Shield className="h-3 w-3" />
                          VPN/Proxy
                        </Badge>
                      )}
                      {session.country_code !== 'BR' && session.country_code !== 'XX' && (
                        <Badge variant="secondary" className="text-xs">
                          🌍 Internacional
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
