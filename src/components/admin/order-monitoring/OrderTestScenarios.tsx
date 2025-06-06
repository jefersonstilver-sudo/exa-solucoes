
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  TestTube,
  Target,
  Zap
} from 'lucide-react';
import { useOrderTestScenarios } from '@/hooks/useOrderTestScenarios';
import { useUserSession } from '@/hooks/useUserSession';

const OrderTestScenarios: React.FC = () => {
  const { user } = useUserSession();
  const {
    isRunningTests,
    testResults,
    runAllTestScenarios
  } = useOrderTestScenarios();

  const handleRunTests = () => {
    if (!user?.id) {
      alert('Usuário não autenticado');
      return;
    }
    runAllTestScenarios(user.id);
  };

  const getResultIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getResultColor = (success: boolean) => {
    return success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50';
  };

  const passedTests = testResults.filter(r => r.success).length;
  const totalTests = testResults.length;
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TestTube className="h-5 w-5 mr-2 text-purple-600" />
          Cenários de Teste de Criação de Pedidos
        </CardTitle>
        <p className="text-sm text-gray-600">
          Execute cenários de teste para validar o funcionamento do sistema de criação de pedidos
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Controles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleRunTests}
              disabled={isRunningTests || !user?.id}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isRunningTests ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Executando Testes...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Executar Todos os Testes
                </>
              )}
            </Button>
            
            {!user?.id && (
              <Badge variant="destructive">
                Usuário não autenticado
              </Badge>
            )}
          </div>

          {testResults.length > 0 && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                <p className={`text-lg font-bold ${successRate === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {successRate.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Testes</p>
                <p className="text-lg font-bold">{passedTests}/{totalTests}</p>
              </div>
            </div>
          )}
        </div>

        {/* Resultados dos Testes */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              Resultados dos Testes
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {testResults.map((result, index) => (
                <div 
                  key={result.scenarioId} 
                  className={`p-4 border-2 rounded-lg ${getResultColor(result.success)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getResultIcon(result.success)}
                      <div>
                        <p className="font-medium">Cenário {index + 1}: {result.scenarioId}</p>
                        <p className="text-sm text-gray-600">
                          {result.success ? 'Teste passou com sucesso' : 'Teste falhou'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{result.executionTime}ms</span>
                      </div>
                      
                      <Badge variant={result.dataValidation ? "default" : "destructive"}>
                        {result.dataValidation ? 'Dados OK' : 'Dados Inválidos'}
                      </Badge>
                      
                      {result.orderId && (
                        <Badge variant="outline">
                          ID: {result.orderId.substring(0, 8)}...
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {result.error && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                      <strong>Erro:</strong> {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Como Funciona
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Os testes simulam diferentes cenários de criação de pedidos</li>
            <li>• Cada teste valida a integridade dos dados salvos</li>
            <li>• Testes incluem cenários de sucesso e falha esperados</li>
            <li>• Os dados de teste são removidos automaticamente após validação</li>
            <li>• Uma taxa de sucesso de 100% indica que o sistema está funcionando corretamente</li>
          </ul>
        </div>

        {/* Status do Sistema */}
        {testResults.length > 0 && (
          <div className={`p-4 border-2 rounded-lg ${successRate === 100 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
            <div className="flex items-center space-x-3">
              {successRate === 100 ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-yellow-600" />
              )}
              <div>
                <p className="font-semibold">
                  {successRate === 100 ? 'Sistema Pronto!' : 'Atenção Necessária'}
                </p>
                <p className="text-sm text-gray-600">
                  {successRate === 100 
                    ? 'Todos os testes passaram. O sistema está funcionando corretamente e pronto para criar pedidos.'
                    : 'Alguns testes falharam. Verifique os problemas antes de criar pedidos em produção.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderTestScenarios;
