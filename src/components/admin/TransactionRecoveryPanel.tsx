
// Painel de Recuperação de Transações para Admin

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { transactionRecoveryManager } from '@/utils/transactionRecoveryManager';
import { duplicateOrderPrevention } from '@/utils/duplicateOrderPrevention';
import { priceIntegrityManager } from '@/utils/priceIntegrityManager';
import { AlertTriangle, CheckCircle, Search, RefreshCw } from 'lucide-react';

const TransactionRecoveryPanel = () => {
  const [userEmail, setUserEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<any>(null);
  const [systemStats, setSystemStats] = useState<any>(null);

  const handleSpecificRecovery = async () => {
    if (!userEmail || !amount) {
      alert('Digite o email e valor da transação');
      return;
    }

    setIsRecovering(true);
    try {
      const result = await transactionRecoveryManager.recoverSpecificTransaction(
        userEmail,
        parseFloat(amount)
      );
      setRecoveryResult(result);
    } catch (error) {
      console.error('Erro na recuperação:', error);
      setRecoveryResult({
        success: false,
        errors: [error.message],
        recoveredTransactions: 0,
        totalValue: 0
      });
    } finally {
      setIsRecovering(false);
    }
  };

  const loadSystemStats = () => {
    const duplicateStats = duplicateOrderPrevention.getStats();
    const priceInconsistencies = priceIntegrityManager.detectInconsistencies();
    
    setSystemStats({
      duplicateStats,
      priceInconsistencies,
      timestamp: new Date().toISOString()
    });
  };

  const clearSystemCache = () => {
    duplicateOrderPrevention.clearAll();
    priceIntegrityManager.clearHistory();
    alert('Cache do sistema limpo');
    loadSystemStats();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recuperação de Transação Específica
          </CardTitle>
          <CardDescription>
            Recuperar transação paga que não foi processada corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email do Usuário</label>
              <Input
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="email@exemplo.com"
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Valor da Transação (R$)</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.29"
                type="number"
                step="0.01"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSpecificRecovery} 
            disabled={isRecovering}
            className="w-full"
          >
            {isRecovering ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Recuperando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Recuperar Transação
              </>
            )}
          </Button>

          {recoveryResult && (
            <Alert className={recoveryResult.success ? "border-green-200" : "border-red-200"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {recoveryResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">
                      {recoveryResult.success ? 'Recuperação bem-sucedida!' : 'Falha na recuperação'}
                    </span>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <p>Transações recuperadas: {recoveryResult.recoveredTransactions}</p>
                    <p>Valor total: R$ {recoveryResult.totalValue.toFixed(2)}</p>
                    
                    {recoveryResult.errors && recoveryResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-red-600">Erros:</p>
                        <ul className="list-disc pl-4">
                          {recoveryResult.errors.map((error, index) => (
                            <li key={index} className="text-red-600">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {recoveryResult.details && recoveryResult.details.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Detalhes:</p>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(recoveryResult.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
          <CardDescription>
            Monitoramento dos sistemas de integridade e prevenção
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={loadSystemStats} variant="outline">
              Atualizar Status
            </Button>
            <Button onClick={clearSystemCache} variant="destructive">
              Limpar Cache
            </Button>
          </div>

          {systemStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium">Prevenção de Duplicados</h4>
                  <p className="text-sm text-gray-600">
                    Tentativas recentes: {systemStats.duplicateStats.recentAttempts}
                  </p>
                  <p className="text-sm text-gray-600">
                    Locks ativos: {systemStats.duplicateStats.activeLocks}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium">Integridade de Preços</h4>
                  <p className="text-sm text-gray-600">
                    Inconsistências: {systemStats.priceInconsistencies.length}
                  </p>
                  {systemStats.priceInconsistencies.length > 0 && (
                    <Badge variant="destructive" className="mt-1">
                      Atenção Necessária
                    </Badge>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium">Sistema</h4>
                  <p className="text-sm text-gray-600">
                    Status: Operacional
                  </p>
                  <Badge variant="default" className="mt-1">
                    Online
                  </Badge>
                </div>
              </div>
              
              {systemStats.priceInconsistencies.length > 0 && (
                <Alert className="border-yellow-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div>
                      <p className="font-medium">Inconsistências de Preço Detectadas:</p>
                      <ul className="list-disc pl-4 mt-1">
                        {systemStats.priceInconsistencies.map((issue, index) => (
                          <li key={index} className="text-sm">{issue}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionRecoveryPanel;
