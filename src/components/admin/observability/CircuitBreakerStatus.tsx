import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ShieldOff, 
  ShieldAlert,
  Clock,
  Loader2
} from 'lucide-react';
import { CircuitBreakerStatus as CircuitBreakerStatusType } from '@/hooks/useObservabilityData';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CircuitBreakerStatusProps {
  circuitBreakers: CircuitBreakerStatusType[];
  isLoading: boolean;
}

export const CircuitBreakerStatusPanel: React.FC<CircuitBreakerStatusProps> = ({
  circuitBreakers,
  isLoading,
}) => {
  const isOpen = (state: string) => state === 'open';
  const isHalfOpen = (state: string) => state === 'half_open';

  const getStatusIcon = (state: string) => {
    if (isOpen(state)) {
      return <ShieldOff className="h-5 w-5 text-red-500" />;
    }
    if (isHalfOpen(state)) {
      return <ShieldAlert className="h-5 w-5 text-amber-500" />;
    }
    return <Shield className="h-5 w-5 text-green-500" />;
  };

  const getStatusBadge = (state: string) => {
    if (isOpen(state)) {
      return <Badge variant="destructive">Aberto</Badge>;
    }
    if (isHalfOpen(state)) {
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Semi-Aberto</Badge>;
    }
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Fechado</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Circuit Breakers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const openCount = circuitBreakers.filter(cb => isOpen(cb.state)).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Circuit Breakers
            {openCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {openCount} aberto(s)
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {circuitBreakers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Shield className="h-10 w-10 text-green-500 mb-2" />
            <p className="text-sm">Todos os circuit breakers fechados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {circuitBreakers.map((cb) => (
              <div
                key={cb.id}
                className={`p-4 rounded-lg border transition-all ${
                  isOpen(cb.state)
                    ? 'bg-red-500/5 border-red-500/20'
                    : isHalfOpen(cb.state)
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-green-500/5 border-green-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(cb.state)}
                    <div>
                      <p className="font-medium text-sm">{cb.agent_key}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>Falhas: {cb.failure_count}</span>
                        {cb.last_failure_at && (
                          <>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>
                              Última falha:{' '}
                              {formatDistanceToNow(new Date(cb.last_failure_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(cb.state)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
