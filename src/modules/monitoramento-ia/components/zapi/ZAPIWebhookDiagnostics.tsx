import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Settings, TestTube } from 'lucide-react';

interface ZAPIWebhookDiagnosticsProps {
  agentKey: string;
  agentName: string;
}

interface DiagnosisResult {
  instanceStatus: any;
  webhookConfig: any;
  issues: string[];
  recommendations: string[];
}

export const ZAPIWebhookDiagnostics = ({ agentKey, agentName }: ZAPIWebhookDiagnosticsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setLastAction('diagnose');
    
    try {
      const { data, error } = await supabase.functions.invoke('configure-zapi-webhook', {
        body: {
          agentKey,
          action: 'diagnose'
        }
      });

      if (error) throw error;

      console.log('[DIAGNOSTICS] Result:', data);
      setDiagnosis(data.diagnosis);
      
      if (data.diagnosis.issues.length === 0) {
        toast.success('✅ Webhook configurado corretamente!');
      } else {
        toast.warning(`⚠️ ${data.diagnosis.issues.length} problema(s) encontrado(s)`);
      }
    } catch (error) {
      console.error('[DIAGNOSTICS] Error:', error);
      toast.error('Erro ao executar diagnóstico: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const configureWebhook = async () => {
    setIsLoading(true);
    setLastAction('configure');
    
    try {
      const { data, error } = await supabase.functions.invoke('configure-zapi-webhook', {
        body: {
          agentKey,
          action: 'configure'
        }
      });

      if (error) throw error;

      console.log('[CONFIGURE] Result:', data);
      toast.success('✅ Webhook configurado com sucesso!');
      
      // Re-run diagnostics
      setTimeout(() => runDiagnostics(), 2000);
    } catch (error) {
      console.error('[CONFIGURE] Error:', error);
      toast.error('Erro ao configurar webhook: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const testConfiguration = async () => {
    const testPhone = prompt('Digite o número de telefone para teste (com código do país, ex: 5545999999999):');
    if (!testPhone) return;

    setIsLoading(true);
    setLastAction('test');
    
    try {
      const { data, error } = await supabase.functions.invoke('configure-zapi-webhook', {
        body: {
          agentKey,
          action: 'test',
          testPhone
        }
      });

      if (error) throw error;

      console.log('[TEST] Result:', data);
      toast.success('🧪 Mensagem de teste enviada! Aguarde alguns segundos...');
    } catch (error) {
      console.error('[TEST] Error:', error);
      toast.error('Erro ao enviar teste: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Diagnóstico do Webhook Z-API
        </CardTitle>
        <CardDescription>
          Agente: <strong>{agentName}</strong> ({agentKey})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={runDiagnostics}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading && lastAction === 'diagnose' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Diagnosticando...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Executar Diagnóstico
              </>
            )}
          </Button>

          <Button
            onClick={configureWebhook}
            disabled={isLoading}
            variant="default"
          >
            {isLoading && lastAction === 'configure' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Configurar Webhook
              </>
            )}
          </Button>

          <Button
            onClick={testConfiguration}
            disabled={isLoading}
            variant="secondary"
          >
            {isLoading && lastAction === 'test' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Testar Configuração
              </>
            )}
          </Button>
        </div>

        {/* Diagnosis Results */}
        {diagnosis && (
          <div className="space-y-4 mt-6">
            {/* Issues */}
            {diagnosis.issues.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Problemas Encontrados:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {diagnosis.issues.map((issue, i) => (
                      <li key={i} className="text-sm">{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Recommendations */}
            {diagnosis.recommendations.length > 0 && (
              <Alert>
                <CheckCircle2 className="w-4 h-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Recomendações:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {diagnosis.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Status Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Instance Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status da Instância</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Conectado:</span>
                      <Badge variant={diagnosis.instanceStatus?.connected ? "default" : "destructive"}>
                        {diagnosis.instanceStatus?.connected ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Telefone:</span>
                      <span className="text-sm font-mono">
                        {diagnosis.instanceStatus?.phone || 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Webhook Config */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Configuração do Webhook</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Habilitado:</span>
                      <Badge variant={diagnosis.webhookConfig?.enabled ? "default" : "destructive"}>
                        {diagnosis.webhookConfig?.enabled ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Recebe fromMe:</span>
                      <Badge variant={
                        diagnosis.webhookConfig?.receiveSentMessages ||
                        diagnosis.webhookConfig?.receivingOwnMessages ||
                        diagnosis.webhookConfig?.includeOwnMessages
                          ? "default"
                          : "destructive"
                      }>
                        {diagnosis.webhookConfig?.receiveSentMessages ||
                         diagnosis.webhookConfig?.receivingOwnMessages ||
                         diagnosis.webhookConfig?.includeOwnMessages
                          ? 'Sim'
                          : 'Não'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Raw Data (Collapsible) */}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Ver dados completos (debug)
              </summary>
              <pre className="mt-2 p-4 bg-muted rounded-lg overflow-auto max-h-96">
                {JSON.stringify(diagnosis, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Help Text */}
        {!diagnosis && (
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Como usar:</strong>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Clique em "Executar Diagnóstico" para verificar a configuração atual</li>
                <li>Se houver problemas, clique em "Configurar Webhook" para corrigir automaticamente</li>
                <li>Use "Testar Configuração" para enviar uma mensagem de teste e verificar se aparece no CRM</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
