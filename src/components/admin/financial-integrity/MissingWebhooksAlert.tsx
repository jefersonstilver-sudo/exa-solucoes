
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { FinancialStats } from './types';

interface MissingWebhooksAlertProps {
  stats: FinancialStats | null;
  onRunAudit: () => void;
  loading: boolean;
}

const MissingWebhooksAlert: React.FC<MissingWebhooksAlertProps> = ({ 
  stats, 
  onRunAudit, 
  loading 
}) => {
  if (!stats || stats.missing_webhooks === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-yellow-700">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Alerta: Webhooks Ausentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">
          {stats.missing_webhooks} pedido(s) confirmado(s) sem webhook correspondente do MercadoPago.
          Isso pode indicar pagamentos processados fora do fluxo padrão.
        </p>
        <Button 
          onClick={onRunAudit} 
          className="mt-3" 
          variant="outline"
          disabled={loading}
        >
          Investigar e Corrigir
        </Button>
      </CardContent>
    </Card>
  );
};

export default MissingWebhooksAlert;
