import { useState } from 'react';
import { Globe, Monitor, Smartphone, Tablet, Shield, Wifi, MapPin, Clock, ChevronDown, ChevronUp, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CollapsibleCard } from '@/components/admin/shared/CollapsibleCard';
import { ClientInsights } from './ClientInsights';
import { useClientTracking } from '@/hooks/useClientTracking';
import type { ActiveSession } from '@/hooks/useActiveUsers';

interface ActiveSessionsListProps {
  sessions: ActiveSession[];
}

const SessionCard = ({ session }: { session: ActiveSession }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { trackingData, isLoading } = useClientTracking(session.user_id);

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
    if (!countryCode || countryCode === 'XX' || countryCode.length !== 2) {
      return '🌍';
    }
    const codePoints = [...countryCode.toUpperCase()]
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const getRiskBadgeColor = () => {
    if (!trackingData) return 'secondary';
    if (trackingData.riskScore >= 70) return 'destructive';
    if (trackingData.riskScore >= 40) return 'default';
    return 'outline';
  };

  // Preview compacto (sempre visível)
  const preview = (
    <div className="flex items-center justify-between gap-4 w-full">
      {/* Flag e País */}
      <div className="flex items-center gap-3 min-w-[140px]">
        <div className="text-3xl flex-shrink-0">
          {getCountryFlag(session.country_code)}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm truncate">
            {session.country !== 'Unknown' ? session.country : 'Desconhecido'}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {session.city !== 'Unknown' && session.city ? session.city : '?'}
          </span>
        </div>
      </div>

      {/* Nome do Usuário */}
      <div className="flex items-center gap-2 min-w-[180px] flex-1">
        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="font-medium text-sm truncate">
          {session.user_name || (session.user_id ? 'Usuário Autenticado' : 'Visitante Anônimo')}
        </span>
      </div>

      {/* IP */}
      <div className="flex items-center gap-2 min-w-[140px]">
        <Wifi className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="font-mono text-sm">{session.ip_address}</span>
      </div>

      {/* Dispositivo */}
      <div className="flex items-center gap-2 min-w-[120px]">
        {getDeviceIcon(session.device_type)}
        <span className="text-sm capitalize">
          {session.device_type}
        </span>
      </div>

      {/* Badges */}
      <div className="flex gap-1 flex-shrink-0">
        {session.user_id && (
          <Badge variant="default" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            Autenticado
          </Badge>
        )}
        {session.is_vpn && (
          <Badge variant="destructive" className="text-xs">
            VPN
          </Badge>
        )}
        {trackingData && (
          <Badge variant={getRiskBadgeColor()} className="text-xs">
            Risco: {trackingData.riskScore}%
          </Badge>
        )}
      </div>
    </div>
  );

  // Conteúdo expandido (visível ao clicar)
  const expandedContent = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Coluna Esquerda: Detalhes Técnicos */}
      <div className="space-y-3">
        <div className="space-y-2">
          <h5 className="font-semibold text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Localização Detalhada
          </h5>
          <div className="pl-6 space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Cidade:</span>{' '}
              {session.city !== 'Unknown' && session.city ? session.city : 'Desconhecido'}
            </div>
            <div>
              <span className="text-muted-foreground">Região:</span>{' '}
              {session.region !== 'Unknown' && session.region ? session.region : 'Desconhecido'}
            </div>
            <div>
              <span className="text-muted-foreground">País:</span>{' '}
              {session.country !== 'Unknown' ? session.country : 'Desconhecido'}
            </div>
            {session.latitude !== 0 && session.longitude !== 0 && (
              <div>
                <span className="text-muted-foreground">Coordenadas:</span>{' '}
                {session.latitude.toFixed(4)}, {session.longitude.toFixed(4)}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="font-semibold text-sm flex items-center gap-2">
            <Wifi className="h-4 w-4 text-primary" />
            Rede e Conexão
          </h5>
          <div className="pl-6 space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">IP:</span>{' '}
              <span className="font-mono">{session.ip_address}</span>
            </div>
            {session.isp && (
              <div>
                <span className="text-muted-foreground">ISP:</span> {session.isp}
              </div>
            )}
            {session.asn && (
              <div>
                <span className="text-muted-foreground">ASN:</span> {session.asn}
              </div>
            )}
            {session.org && (
              <div>
                <span className="text-muted-foreground">Organização:</span> {session.org}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="font-semibold text-sm flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            Dispositivo e Sistema
          </h5>
          <div className="pl-6 space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Navegador:</span> {session.browser}
            </div>
            <div>
              <span className="text-muted-foreground">Tipo:</span> {session.device_type}
            </div>
            {session.platform && (
              <div>
                <span className="text-muted-foreground">Plataforma:</span> {session.platform}
              </div>
            )}
            {session.screen_width && session.screen_height && (
              <div>
                <span className="text-muted-foreground">Resolução:</span>{' '}
                {session.screen_width}×{session.screen_height}
                {session.pixel_ratio && ` (${session.pixel_ratio}× DPR)`}
              </div>
            )}
            {session.cpu_cores && (
              <div>
                <span className="text-muted-foreground">CPU:</span> {session.cpu_cores} cores
              </div>
            )}
            {session.device_memory && (
              <div>
                <span className="text-muted-foreground">RAM:</span> {session.device_memory} GB
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="font-semibold text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Atividade
          </h5>
          <div className="pl-6 space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Última atividade:</span>{' '}
              {formatDistanceToNow(new Date(session.last_activity), {
                addSuffix: true,
                locale: ptBR
              })}
            </div>
            <div>
              <span className="text-muted-foreground">Criado:</span>{' '}
              {formatDistanceToNow(new Date(session.created_at), {
                addSuffix: true,
                locale: ptBR
              })}
            </div>
            {session.timezone && (
              <div>
                <span className="text-muted-foreground">Timezone:</span> {session.timezone}
              </div>
            )}
            {session.language && (
              <div>
                <span className="text-muted-foreground">Idioma:</span> {session.language}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coluna Direita: Rastreabilidade do Cliente */}
      <div>
        <h5 className="font-semibold text-sm flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary" />
          Rastreabilidade do Cliente
        </h5>
        <ClientInsights trackingData={trackingData} isLoading={isLoading} />
      </div>
    </div>
  );

  return (
    <CollapsibleCard
      preview={preview}
      defaultExpanded={false}
      className="hover:shadow-md transition-shadow"
      borderColor={session.is_vpn ? 'border-destructive' : 'border-primary'}
    >
      {expandedContent}
    </CollapsibleCard>
  );
};

export const ActiveSessionsList = ({ sessions }: ActiveSessionsListProps) => {
  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <span className="flex-1">Sessões Ativas em Tempo Real</span>
          <Badge variant="secondary" className="ml-auto font-semibold px-3 py-1">
            {sessions.length} {sessions.length === 1 ? 'sessão' : 'sessões'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] px-4 md:px-6">
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
              sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
