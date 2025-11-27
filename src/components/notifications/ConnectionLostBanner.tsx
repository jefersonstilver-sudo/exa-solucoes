import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConnectionLostBannerProps {
  agentName: string;
  disconnectedSince?: string;
}

export const ConnectionLostBanner = ({ agentName, disconnectedSince }: ConnectionLostBannerProps) => {
  return (
    <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 mb-3">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="text-sm">
        <strong>Conexão perdida</strong> - {agentName} está desconectado{' '}
        {disconnectedSince && `desde ${new Date(disconnectedSince).toLocaleTimeString('pt-BR')}`}
      </AlertDescription>
    </Alert>
  );
};
