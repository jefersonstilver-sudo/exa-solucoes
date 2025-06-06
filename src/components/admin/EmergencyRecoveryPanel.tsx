
// Painel de Recuperação Emergencial

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { emergencyRecoverySystem } from '@/utils/emergencyRecoverySystem';
import { AlertTriangle, CheckCircle, DollarSign, Wrench, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const EmergencyRecoveryPanel = () => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<any>(null);

  const handleEmergencyRecovery = async () => {
    setIsRecovering(true);
    try {
      const result = await emergencyRecoverySystem.recoverSpecificPatagoniaTransaction();
      setRecoveryResult(result);
      
      if (result.success) {
        toast.success(result.message);
        // Também corrigir o sistema de cálculo
        await emergencyRecoverySystem.fixCalculationSystem();
        await emergencyRecoverySystem.setupEmergencyWebhook();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Erro na recuperação emergencial:', error);
      toast.error('Erro na recuperação emergencial');
      setRecoveryResult({
        success: false,
        message: `Erro: ${error.message}`,
        details: {}
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Recuperação Emergencial - Transação R$ 0,15
          </CardTitle>
          <CardDescription className="text-red-600">
            Sistema para recuperar a transação paga de R$ 0,15 (3 meses - Vale do Monjolo) que não foi processada corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded border border-red-200">
            <h4 className="font-medium text-red-800 mb-2">Problema Detectado:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Pedido de R$ 0,15 (3 meses) pago mas não processado</li>
              <li>• Aparecimento de pedidos duplicados de R$ 0,10 (incorretos)</li>
              <li>• Falha no processamento do webhook do MercadoPago</li>
              <li>• Sistema de anti-duplicação não funcionou</li>
            </ul>
          </div>

          <Button 
            onClick={handleEmergencyRecovery} 
            disabled={isRecovering}
            className="w-full bg-red-600 hover:bg-red-700"
            size="lg"
          >
            {isRecovering ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Executando Recuperação Emergencial...
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4 mr-2" />
                EXECUTAR RECUPERAÇÃO EMERGENCIAL
              </>
            )}
          </Button>

          {recoveryResult && (
            <Alert className={recoveryResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {recoveryResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">
                      {recoveryResult.success ? 'Recuperação Bem-Sucedida!' : 'Falha na Recuperação'}
                    </span>
                  </div>
                  
                  <p className="text-sm">{recoveryResult.message}</p>
                  
                  {recoveryResult.success && recoveryResult.details && (
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium text-green-800 mb-2">Detalhes da Recuperação:</h5>
                      <div className="text-sm space-y-1">
                        <div>✅ Valor Correto: R$ {recoveryResult.details.amount}</div>
                        <div>✅ Plano: {recoveryResult.details.planMonths} meses</div>
                        <div>✅ Prédio: {recoveryResult.details.building}</div>
                        <div>✅ Duplicados Removidos: {recoveryResult.details.duplicatesRemoved ? 'Sim' : 'Não'}</div>
                        {recoveryResult.transactionId && (
                          <div>✅ ID do Pedido: {recoveryResult.transactionId}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {!recoveryResult.success && (
                    <div className="bg-white p-3 rounded border border-red-200">
                      <h5 className="font-medium text-red-800 mb-2">Detalhes do Erro:</h5>
                      <pre className="text-xs text-red-600 overflow-auto">
                        {JSON.stringify(recoveryResult.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Próximos Passos Após Recuperação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline">1</Badge>
              <div>
                <p className="font-medium">Verificar Pedido Recuperado</p>
                <p className="text-sm text-gray-600">Vá em "Meus Pedidos" para confirmar que o pedido de R$ 0,15 está como "Pago"</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Badge variant="outline">2</Badge>
              <div>
                <p className="font-medium">Testar Novo Pedido</p>
                <p className="text-sm text-gray-600">Faça um novo teste de pedido para verificar se os valores estão corretos</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Badge variant="outline">3</Badge>
              <div>
                <p className="font-medium">Monitorar Sistema</p>
                <p className="text-sm text-gray-600">Acompanhe se não há mais duplicações ou valores incorretos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyRecoveryPanel;
