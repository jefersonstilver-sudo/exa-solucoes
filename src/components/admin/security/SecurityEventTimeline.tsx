import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SecurityEvent } from '@/types/security';

interface SecurityEventTimelineProps {
  events: SecurityEvent[];
  isConnected: boolean;
}

export const SecurityEventTimeline = ({ events, isConnected }: SecurityEventTimelineProps) => {
  const getEventBadgeColor = (eventType: string) => {
    if (eventType.includes('suspicious') || eventType.includes('rate_limit_exceeded')) {
      return 'destructive';
    }
    if (eventType.includes('failed') || eventType.includes('error')) {
      return 'secondary';
    }
    if (eventType.includes('admin')) {
      return 'default';
    }
    return 'outline';
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle>Timeline de Eventos</CardTitle>
          {isConnected && (
            <Badge variant="outline" className="animate-pulse">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
              AO VIVO
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6">
          <div className="space-y-4 pb-4">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum evento registrado
              </div>
            ) : (
              events.map((event, index) => (
                <div
                  key={event.id || index}
                  className="border-l-2 border-muted pl-4 pb-4 relative hover:bg-muted/50 -ml-px transition-colors"
                >
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1" />
                  
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={getEventBadgeColor(event.tipo_evento)} className="text-xs">
                      {event.tipo_evento}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(event.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>

                  <p className="text-sm mb-2">{event.descricao}</p>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <strong>IP:</strong> {event.ip || 'unknown'}
                    </span>
                    {event.user_agent && (
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <strong>User Agent:</strong> {event.user_agent}
                      </span>
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
