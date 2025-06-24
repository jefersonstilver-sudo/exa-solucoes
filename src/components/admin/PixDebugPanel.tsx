
// Painel de Debug PIX para Admin

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePixDebug } from '@/hooks/usePixDebug';
import { Loader2, Bug, Zap, TestTube, Wifi } from 'lucide-react';

interface PixDebugPanelProps {
  className?: string;
}

const PixDebugPanel = ({ className }: PixDebugPanelProps) => {
  const { isDebugging, debugResults, runFullDiagnosis, simulatePayment, checkWebhookStatus } = usePixDebug();

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debug Sistema PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Botões de Ação */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={runFullDiagnosis}
              disabled={isDebugging}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isDebugging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Diagnóstico Completo
            </Button>

            <Button
              onClick={checkWebhookStatus}
              disabled={isDebugging}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isDebugging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              Testar Webhook
            </Button>

            <Button
              onClick={() => {
                const pedidoId = prompt('Digite o ID do pedido para simular pagamento:');
                if (pedidoId) {
                  simulatePayment(pedidoId);
                }
              }}
              disabled={isDebugging}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isDebugging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Simular Pagamento
            </Button>
          </div>

          {/* Resultados do Debug */}
          {debugResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Resultados do Diagnóstico</h3>
                <Badge variant={debugResults.summary.totalIssues > 0 ? "destructive" : "default"}>
                  {debugResults.summary.totalIssues} problema(s)
                </Badge>
              </div>

              {/* Pagamentos Perdidos */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pagamentos Perdidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {debugResults.lostPayments.findings.map((finding: string, index: number) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                        {finding}
                      </div>
                    ))}
                  </div>
                  {debugResults.lostPayments.recommendations.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium mb-2">Recomendações:</h4>
                      <ul className="text-sm space-y-1">
                        {debugResults.lostPayments.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-yellow-700">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conectividade */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Status da Conectividade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {debugResults.connectivity.findings.map((finding: string, index: number) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                        {finding}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Timestamp */}
              <div className="text-xs text-gray-500">
                Diagnóstico executado em: {new Date(debugResults.timestamp).toLocaleString()}
              </div>
            </div>
          )}

          {/* Instruções */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Como usar:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Diagnóstico Completo:</strong> Verifica todo o sistema PIX</li>
              <li>• <strong>Testar Webhook:</strong> Verifica se a URL de webhook responde</li>
              <li>• <strong>Simular Pagamento:</strong> Força confirmação de um pedido específico</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PixDebugPanel;
