
// Painel de Recuperação Unificada com Sistema de Transações

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useUnifiedTransaction } from '@/hooks/useUnifiedTransaction';
import { useEnhancedAttemptCapture } from '@/hooks/useEnhancedAttemptCapture';
import { CheckCircle, AlertTriangle, RefreshCw, Shield, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const UnifiedRecoveryPanel = () => {
  const { recoverLostTransactions } = useUnifiedTransaction();
  const { cleanupOrphanedAttempts } = useEnhancedAttemptCapture();
  
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<any>(null);

  const handleUnifiedRecovery = async () => {
    setIsRecovering(true);
    
    try {
      toast.loading("Executando recuperação unificada...");

      // Passo 1: Recuperar transações perdidas
      const recoveryResult = await recoverLostTransactions();
      
      // Passo 2: Limpar tentativas órfãs
      const cleanupCount = await cleanupOrphanedAttempts();

      const finalResult = {
        success: recoveryResult.success,
        recovered_transactions: recoveryResult.recovered_transactions || 0,
        total_value_recovered: recoveryResult.total_value_recovered || 0,
        orphaned_attempts_cleaned: cleanupCount,
        timestamp: new Date().toISOString()
      };

      setRecoveryResult(finalResult);

      if (finalResult.success) {
        toast.success(`Recuperação concluída! ${finalResult.recovered_transactions} transações recuperadas.`);
      } else {
        toast.error("Erro na recuperação unificada");
      }

    } catch (error: any) {
      console.error('Erro na recuperação unificada:', error);
      toast.error('Erro na recuperação unificada');
      
      setRecoveryResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRecovering(false);
      toast.dismiss();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Shield className="h-5 w-5" />
            Sistema de Recuperação Unificada
          </CardTitle>
          <CardDescription className="text-blue-600">
            Sistema automatizado para recuperar transações perdidas e limpar dados órfãos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">O que este sistema faz:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Identifica tentativas órfãs (sem pedidos correspondentes)</li>
              <li>• Migra tentativas válidas para pedidos completos</li>
              <li>• Remove duplicações e inconsistências</li>
              <li>• Garante integridade entre transaction_id, tentativas e pedidos</li>
              <li>• Limpa dados antigos para otimizar performance</li>
            </ul>
          </div>

          <Button 
            onClick={handleUnifiedRecovery} 
            disabled={isRecovering}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isRecovering ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Executando Recuperação Unificada...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                EXECUTAR RECUPERAÇÃO UNIFICADA
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
                      {recoveryResult.success ? 'Recuperação Concluída!' : 'Falha na Recuperação'}
                    </span>
                  </div>
                  
                  {recoveryResult.success && (
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium text-green-800 mb-2">Resultados:</h5>
                      <div className="text-sm space-y-1">
                        <div>✅ Transações Recuperadas: {recoveryResult.recovered_transactions}</div>
                        <div>✅ Valor Total Recuperado: R$ {recoveryResult.total_value_recovered}</div>
                        <div>✅ Tentativas Órfãs Limpas: {recoveryResult.orphaned_attempts_cleaned}</div>
                        <div>✅ Processado em: {new Date(recoveryResult.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                  
                  {!recoveryResult.success && (
                    <div className="bg-white p-3 rounded border border-red-200">
                      <h5 className="font-medium text-red-800 mb-2">Erro:</h5>
                      <p className="text-sm text-red-600">{recoveryResult.error}</p>
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
            Sistema de Transações Únicas Implementado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-green-50">✅</Badge>
              <div>
                <p className="font-medium">ID de Transação Único</p>
                <p className="text-sm text-gray-600">Cada checkout gera um transaction_id único que liga tentativa → pedido → pagamento</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-green-50">✅</Badge>
              <div>
                <p className="font-medium">Preço Bloqueado</p>
                <p className="text-sm text-gray-600">Preço calculado UMA única vez na tentativa e nunca recalculado no pedido</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-green-50">✅</Badge>
              <div>
                <p className="font-medium">Recuperação Automática</p>
                <p className="text-sm text-gray-600">Sistema identifica e migra tentativas órfãs para pedidos válidos automaticamente</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-green-50">✅</Badge>
              <div>
                <p className="font-medium">Prevenção de Duplicação</p>
                <p className="text-sm text-gray-600">Validação por transaction_id impede pedidos duplicados</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedRecoveryPanel;
