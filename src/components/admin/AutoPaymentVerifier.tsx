
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAutoPaymentVerifier } from '@/hooks/useAutoPaymentVerifier';

export const AutoPaymentVerifier: React.FC = () => {
  const {
    isRunning,
    lastResult,
    isAutoRunning,
    runVerification,
    startAutoVerification,
    stopAutoVerification
  } = useAutoPaymentVerifier();

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
          <RefreshCw className="h-5 w-5 mr-2" />
          Sistema de Backup Automático para Webhooks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status do Sistema */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            {isAutoRunning ? (
              <Badge className="bg-green-600 text-white">
                <Play className="h-3 w-3 mr-1" />
                Automático Ativo
              </Badge>
            ) : (
              <Badge className="bg-gray-600 text-white">
                <Square className="h-3 w-3 mr-1" />
                Parado
              </Badge>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={runVerification}
              disabled={isRunning}
              variant="outline"
              size="sm"
              className="border-blue-500 text-blue-700 hover:bg-blue-500 hover:text-white"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verificar Agora
                </>
              )}
            </Button>
            
            {!isAutoRunning ? (
              <Button
                onClick={startAutoVerification}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Automático
              </Button>
            ) : (
              <Button
                onClick={stopAutoVerification}
                variant="destructive"
                size="sm"
              >
                <Square className="h-4 w-4 mr-2" />
                Parar Automático
              </Button>
            )}
          </div>
        </div>

        {/* Resultado da Última Verificação */}
        {lastResult && (
          <div className="mt-4 p-4 rounded-lg border">
            <div className="flex items-center mb-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
              )}
              <span className="font-medium">
                Última Verificação: {new Date(lastResult.timestamp).toLocaleString('pt-BR')}
              </span>
            </div>
            
            {lastResult.success ? (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-lg text-blue-600">{lastResult.total_checked}</div>
                  <div className="text-gray-600">Pedidos Verificados</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-orange-600">{lastResult.verified_count}</div>
                  <div className="text-gray-600">APIs Consultadas</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-green-600">{lastResult.approved_count}</div>
                  <div className="text-gray-600">Confirmados</div>
                </div>
              </div>
            ) : (
              <div className="text-red-600 text-sm">
                Erro: {lastResult.errors[0] || 'Erro desconhecido'}
              </div>
            )}
          </div>
        )}

        {/* Informações do Sistema */}
        <div className="text-xs text-gray-600 bg-gray-100 p-3 rounded">
          <p><strong>📋 Como funciona:</strong></p>
          <p>• Verifica pedidos pendentes há mais de 10 minutos</p>
          <p>• Consulta diretamente a API do Mercado Pago</p>
          <p>• Atualiza automaticamente o status se confirmado</p>
          <p>• Roda automaticamente a cada 5 minutos quando ativado</p>
          <p><strong>⏰ Próxima verificação:</strong> {isAutoRunning ? 'Em até 5 minutos' : 'Sistema parado'}</p>
        </div>
      </CardContent>
    </Card>
  );
};
