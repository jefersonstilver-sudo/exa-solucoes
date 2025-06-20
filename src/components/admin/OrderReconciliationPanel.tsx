
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useOrderReconciliation } from '@/hooks/useOrderReconciliation';
import { toast } from 'sonner';

const OrderReconciliationPanel = () => {
  const { reconcilePendingOrders, getPendingOrdersAlert, isProcessing, result } = useOrderReconciliation();
  const [alertCount, setAlertCount] = useState<number>(0);

  useEffect(() => {
    checkPendingAlerts();
    // Verificar a cada 5 minutos
    const interval = setInterval(checkPendingAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkPendingAlerts = async () => {
    try {
      const count = await getPendingOrdersAlert();
      setAlertCount(count);
    } catch (error) {
      console.error('Erro ao verificar alertas:', error);
    }
  };

  const handleReconciliation = async () => {
    try {
      await reconcilePendingOrders();
      await checkPendingAlerts(); // Atualizar alertas após reconciliação
    } catch (error) {
      console.error('Erro na reconciliação:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
            Reconciliação de Pedidos
          </div>
          {alertCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alertCount} alertas
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Status Alerts */}
        {alertCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h4 className="font-medium text-yellow-800">
                  {alertCount} pedidos pendentes há mais de 15 minutos
                </h4>
                <p className="text-sm text-yellow-700">
                  Estes pedidos podem precisar de verificação manual.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleReconciliation}
            disabled={isProcessing}
            className="flex items-center"
          >
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {isProcessing ? 'Processando...' : 'Executar Reconciliação'}
          </Button>

          <Button
            variant="outline"
            onClick={checkPendingAlerts}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Alertas
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <h4 className="font-medium">Resultado da Última Reconciliação:</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {result.totalPending}
                </div>
                <div className="text-sm text-blue-800">Pedidos Auditados</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {result.correctedOrders}
                </div>
                <div className="text-sm text-green-800">Pedidos Corrigidos</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  R$ {result.totalValue.toFixed(2)}
                </div>
                <div className="text-sm text-purple-800">Valor Auditado</div>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {result.errors.length}
                </div>
                <div className="text-sm text-red-800">Erros Encontrados</div>
              </div>
            </div>

            {/* Error Details */}
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h5 className="font-medium text-red-800 mb-2 flex items-center">
                  <XCircle className="h-4 w-4 mr-2" />
                  Erros Encontrados:
                </h5>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Como funciona:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Identifica pedidos pendentes há mais de 15 minutos</li>
            <li>• Verifica se há evidência de pagamento no log</li>
            <li>• Atualiza automaticamente o status para "pago_pendente_video"</li>
            <li>• Registra todas as ações para auditoria</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderReconciliationPanel;
