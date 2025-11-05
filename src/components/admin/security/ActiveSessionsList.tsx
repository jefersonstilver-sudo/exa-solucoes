import { Globe, Monitor, Smartphone, Tablet, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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

  const getCountryFlag = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    return countryCode
      .toUpperCase()
      .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Sessões Ativas ({sessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6">
          <div className="space-y-3 pb-4">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma sessão ativa
              </div>
            ) : (
              sessions.map(session => (
                <div
                  key={session.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-sm">
                        {session.user_name || 'Visitante Anônimo'}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="text-lg">{getCountryFlag(session.country_code)}</span>
                        <span>
                          {session.city}, {session.region} - {session.country}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {getDeviceIcon(session.device_type)}
                          {session.browser}
                        </span>
                        <span>IP: {session.ip_address}</span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Ativo{' '}
                        {formatDistanceToNow(new Date(session.last_activity), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      {session.is_vpn && (
                        <Badge variant="destructive" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          VPN
                        </Badge>
                      )}
                      {session.country_code !== 'BR' && (
                        <Badge variant="outline" className="text-xs">
                          Internacional
                        </Badge>
                      )}
                    </div>
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
