import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResendStatus {
  connected: boolean;
  configured: boolean;
  domain?: string;
  apiKeyMasked?: string;
  error?: string;
  timestamp?: string;
}

export const ResendStatusCard: React.FC = () => {
  const [status, setStatus] = useState<ResendStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const checkResendStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('test-resend-connection');

      if (error) {
        console.error('Error checking Resend status:', error);
        toast.error('Erro ao verificar status do Resend');
        setStatus({ connected: false, configured: false, error: error.message });
        return;
      }

      setStatus(data);
    } catch (error) {
      console.error('Error in checkResendStatus:', error);
      setStatus({ connected: false, configured: false, error: 'Erro ao conectar' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    await checkResendStatus();
    setTesting(false);
    
    if (status?.connected) {
      toast.success('Conexão com Resend OK!');
    } else {
      toast.error('Falha ao conectar com Resend');
    }
  };

  useEffect(() => {
    checkResendStatus();
  }, []);

  if (loading && !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configurações de Email (Resend)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Configurações de Email (Resend)
        </CardTitle>
        <CardDescription>
          Status da integração com Resend para envio de emails transacionais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status da API:</span>
          {status?.connected ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="w-3 h-3" />
              CONECTADA
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="w-3 h-3" />
              {status?.configured ? 'ERRO' : 'NÃO CONFIGURADA'}
            </Badge>
          )}
        </div>

        {status?.apiKeyMasked && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">API Key:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {status.apiKeyMasked}
            </code>
          </div>
        )}

        {status?.domain && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Domínio Verificado:</span>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-mono">{status.domain}</span>
            </div>
          </div>
        )}

        {status?.error && (
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm text-destructive">
              <strong>Erro:</strong> {status.error}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleTestConnection}
            disabled={testing}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {testing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Testar Conexão
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href="https://resend.com/emails"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Logs
            </a>
          </Button>
        </div>

        {!status?.configured && (
          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Configure a variável <code className="font-mono">RESEND_API_KEY</code> nas configurações do Supabase para ativar o envio de emails.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
