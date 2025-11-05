import { AlertTriangle, Globe } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ActiveSession } from '@/hooks/useActiveUsers';

interface GeographicSecurityAlertProps {
  internationalSessions: ActiveSession[];
  vpnSessions: ActiveSession[];
}

export const GeographicSecurityAlert = ({
  internationalSessions,
  vpnSessions
}: GeographicSecurityAlertProps) => {
  if (internationalSessions.length === 0 && vpnSessions.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Acessos de Localizações Suspeitas Detectados</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          {internationalSessions.length > 0 && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>
                <strong>{internationalSessions.length}</strong> acesso(s) de fora do Brasil:{' '}
                {internationalSessions.map(s => s.country).join(', ')}
              </span>
            </div>
          )}
          {vpnSessions.length > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>
                <strong>{vpnSessions.length}</strong> acesso(s) através de VPN detectados
              </span>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
