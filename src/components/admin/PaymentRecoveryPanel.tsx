
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Search, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface RecoveryResult {
  success: boolean;
  total_verificados: number;
  total_recuperados: number;
  detalhes: Array<{
    pedido_id: string;
    payment_id?: string;
    valor: number;
    status: string;
    erro?: string;
  }>;
  timestamp: string;
  error?: string;
}

export const PaymentRecoveryPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<RecoveryResult | null>(null);

  const runRecovery = async () => {
    setIsRunning(true);
    
    try {
      console.log('🚨 [RECOVERY_PANEL] Executando recovery de pagamentos perdidos');

      const { data, error } = await supabase.functions.invoke('recover-lost-payments');

      if (error) {
        throw error;
      }

      const result = data as RecoveryResult;
      setLastResult(result);

      if (result.success && result.total_recuperados > 0) {
        toast.success(`🎉 ${result.total_recuperados} pagamentos recuperados com sucesso!`);
      } else if (result.success) {
        toast.info(`Verificação concluída: ${result.total_verificados} pedidos verificados, nenhum pagamento perdido encontrado.`);
      } else {
        toast.error(`Erro no recovery: ${result.error || 'Erro desconhecido'}`);
      }

    } catch (error: any) {
      console.error('❌ [RECOVERY_PANEL] Erro no recovery:', error);
      const errorResult = {
        success: false,
        total_verificados: 0,
        total_recuperados: 0,
        detalhes: [],
        error: error.message,
        timestamp: new Date().toISOString()
      };
      setLastResult(errorResult);
      toast.error(`Erro no recovery: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="border-2 border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center text-red-800">
          <Search className="h-5 w-5 mr-2" />
          Recovery de Pagamentos Perdidos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-red-700">
            <p><strong>🚨 Sistema de Emergência</strong></p>
            <p>Busca e recupera pagamentos aprovados no MP mas não processados pelo webhook</p>
          </div>
          
          <Button
            onClick={runRecovery}
            disabled={isRunning}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Recuperando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Executar Recovery
              </>
            )}
          </Button>
        </div>

        {/* Resultado do Recovery */}
        {lastResult && (
          <div className="mt-4 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
              )}
              <span className="font-medium">
                Recovery executado: {new Date(lastResult.timestamp).toLocaleString('pt-BR')}
              </span>
            </div>
            
            {lastResult.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg text-blue-600">{lastResult.total_verificados}</div>
                    <div className="text-gray-600">Pedidos Verificados</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-green-600">{lastResult.total_recuperados}</div>
                    <div className="text-gray-600">Pagamentos Recuperados</div>
                  </div>
                </div>

                {lastResult.detalhes && lastResult.detalhes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Detalhes:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {lastResult.detalhes.map((detalhe, index) => (
                        <div key={index} className="flex items-center justify-between text-xs p-2 bg-white rounded">
                          <span>Pedido: {detalhe.pedido_id.slice(-8)}</span>
                          <span>R$ {detalhe.valor.toFixed(2)}</span>
                          <Badge 
                            className={
                              detalhe.status === 'recuperado' 
                                ? 'bg-green-600 text-white' 
                                : detalhe.status === 'nao_encontrado'
                                ? 'bg-gray-600 text-white'
                                : 'bg-red-600 text-white'
                            }
                          >
                            {detalhe.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600 text-sm">
                Erro: {lastResult.error || 'Erro desconhecido'}
              </div>
            )}
          </div>
        )}

        {/* Informações do Sistema */}
        <div className="text-xs text-gray-600 bg-gray-100 p-3 rounded">
          <p><strong>🔧 Como funciona:</strong></p>
          <p>• Busca pedidos pendentes de hoje</p>
          <p>• Consulta API do Mercado Pago por pagamentos aprovados</p>
          <p>• Compara valores e recupera pagamentos perdidos</p>
          <p>• Atualiza automaticamente o status dos pedidos</p>
          <p><strong>⚠️ Use apenas quando suspeitar de webhooks perdidos</strong></p>
        </div>
      </CardContent>
    </Card>
  );
};
