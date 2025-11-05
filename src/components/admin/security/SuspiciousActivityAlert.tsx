import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Ban } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SecurityAnalytics } from '@/services/securityAnalytics';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const SuspiciousActivityAlert = () => {
  const { data: suspiciousIPs = [] } = useQuery({
    queryKey: ['suspicious-ips'],
    queryFn: () => SecurityAnalytics.detectSuspiciousIPs(),
    refetchInterval: 30000
  });

  if (suspiciousIPs.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="border-2">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">
        🚨 Atividade Suspeita Detectada!
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          {suspiciousIPs.length} IP{suspiciousIPs.length > 1 ? 's' : ''} com comportamento suspeito detectado{suspiciousIPs.length > 1 ? 's' : ''} na última hora:
        </p>
        
        <div className="space-y-3">
          {suspiciousIPs.map((ip, index) => (
            <div 
              key={index}
              className="bg-background rounded-lg p-3 border border-destructive/30"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <p className="font-mono font-bold text-destructive">{ip.ip}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Última tentativa: {formatDistanceToNow(new Date(ip.lastAttempt), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </p>
                </div>
                <Badge variant="destructive" className="whitespace-nowrap">
                  {ip.attempts} tentativas
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {ip.eventTypes.map((type, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full mt-3"
                disabled
              >
                <Ban className="h-3 w-3 mr-2" />
                Bloquear IP (em breve)
              </Button>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};
