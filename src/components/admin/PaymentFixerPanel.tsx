
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Zap, RefreshCw, CheckCircle } from 'lucide-react';
import { usePaymentFixer } from '@/hooks/usePaymentFixer';

const PaymentFixerPanel = () => {
  const { 
    fixCurrentPayment, 
    runAutoReconciliation, 
    isFixing, 
    isReconciling 
  } = usePaymentFixer();

  const handleFixCurrentPayment = async () => {
    const result = await fixCurrentPayment();
    console.log('Resultado da correção:', result);
  };

  const handleAutoReconciliation = async () => {
    const result = await runAutoReconciliation();
    console.log('Resultado da reconciliação:', result);
  };

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-800">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Sistema de Correção de Pagamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/80 rounded-lg p-4 border border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-2">🚨 Correção Imediata</h3>
          <p className="text-sm text-orange-700 mb-3">
            Corrige manualmente o pagamento pendente mais recente que já foi aprovado no MercadoPago
          </p>
          <Button 
            onClick={handleFixCurrentPayment}
            disabled={isFixing}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Corrigindo...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Corrigir Pagamento Atual
              </>
            )}
          </Button>
        </div>

        <div className="bg-white/80 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">🔄 Reconciliação Automática</h3>
          <p className="text-sm text-blue-700 mb-3">
            Verifica e processa automaticamente todos os pagamentos pendentes que já foram aprovados
          </p>
          <Button 
            onClick={handleAutoReconciliation}
            disabled={isReconciling}
            variant="outline"
            className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            {isReconciling ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Reconciliando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Executar Reconciliação
              </>
            )}
          </Button>
        </div>

        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <p className="text-xs text-green-700">
            <strong>💡 Dica:</strong> Execute a "Correção Imediata" primeiro para resolver o problema atual, 
            depois use a "Reconciliação Automática" para verificar outros pagamentos pendentes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentFixerPanel;
