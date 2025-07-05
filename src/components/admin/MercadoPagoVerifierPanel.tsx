
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Zap, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VerificationResult {
  success: boolean;
  total_checked: number;
  verified_count: number;
  approved_count: number;
  errors: string[];
  processed_payments: any[];
  timestamp: string;
}

const MercadoPagoVerifierPanel = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<VerificationResult | null>(null);

  const runVerification = async () => {
    setIsVerifying(true);
    
    try {
      console.log('🔍 [MP_PANEL] Executando verificação MercadoPago');

      const { data, error } = await supabase.functions.invoke('mercadopago-payment-verifier');

      if (error) {
        throw error;
      }

      const result = data as VerificationResult;
      setLastResult(result);
      
      if (result.success) {
        if (result.approved_count > 0) {
          toast.success(`✅ Verificação concluída! ${result.approved_count} pagamentos confirmados`);
        } else {
          toast.info('ℹ️ Verificação concluída - Nenhum pagamento novo confirmado');
        }
        
        console.log('✅ [MP_PANEL] Verificação concluída:', result);
      } else {
        toast.error('❌ Erro na verificação MercadoPago');
      }

    } catch (error: any) {
      console.error('❌ [MP_PANEL] Erro na verificação:', error);
      toast.error(`Erro na verificação: ${error.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
          <CreditCard className="h-5 w-5 mr-2" />
          Verificador Automático MercadoPago
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/80 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">🔍 Verificação API MercadoPago</h3>
          <p className="text-sm text-blue-700 mb-3">
            Consulta diretamente a API do MercadoPago para verificar pagamentos pendentes aprovados
          </p>
          <Button 
            onClick={runVerification}
            disabled={isVerifying}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Executar Verificação
              </>
            )}
          </Button>
        </div>

        {lastResult && (
          <div className="bg-white/80 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">📊 Último Resultado</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span>Verificados: {lastResult.verified_count}</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-2 text-blue-500" />
                <span>Aprovados: {lastResult.approved_count}</span>
              </div>
              <div className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2 text-gray-500" />
                <span>Total Checados: {lastResult.total_checked}</span>
              </div>
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                <span>Erros: {lastResult.errors.length}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Última verificação: {new Date(lastResult.timestamp).toLocaleString()}
            </p>
          </div>
        )}

        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <p className="text-xs text-green-700">
            <strong>💡 Sistema Automático:</strong> Esta verificação roda automaticamente a cada 5 minutos via CRON. 
            Use este botão para verificação manual imediata.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MercadoPagoVerifierPanel;
