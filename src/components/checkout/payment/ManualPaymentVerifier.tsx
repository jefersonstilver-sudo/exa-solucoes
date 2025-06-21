
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ManualPaymentVerifierProps {
  pedidoId: string;
  currentStatus: string;
  onStatusUpdated?: () => void;
}

export const ManualPaymentVerifier: React.FC<ManualPaymentVerifierProps> = ({
  pedidoId,
  currentStatus,
  onStatusUpdated
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleVerifyPayment = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      console.log(`🔍 [MANUAL_VERIFY] Verificando pagamento para pedido: ${pedidoId}`);

      // Chamar edge function para verificar pagamento
      const { data, error } = await supabase.functions.invoke('verify-pix-payment', {
        body: { pedido_id: pedidoId }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log(`✅ [MANUAL_VERIFY] Resultado da verificação:`, data);

      setVerificationResult(data);

      if (data.payment_found && data.payment_approved) {
        toast.success("Pagamento confirmado! Status atualizado com sucesso.");
        if (onStatusUpdated) {
          onStatusUpdated();
        }
      } else if (data.payment_found && !data.payment_approved) {
        toast.warning(`Pagamento encontrado mas status: ${data.payment_status}`);
      } else {
        toast.info("Pagamento ainda não encontrado no Mercado Pago. Tente novamente em alguns minutos.");
      }

    } catch (error: any) {
      console.error(`❌ [MANUAL_VERIFY] Erro na verificação:`, error);
      toast.error(`Erro na verificação: ${error.message}`);
      setVerificationResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-600 text-white';
      case 'pending': return 'bg-yellow-600 text-white';
      case 'rejected': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
          <RefreshCw className="h-5 w-5 mr-2" />
          Verificação Manual de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Status atual do pedido:</p>
            <Badge className={getStatusColor(currentStatus)}>
              {currentStatus}
            </Badge>
          </div>
          
          <Button
            onClick={handleVerifyPayment}
            disabled={isVerifying}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verificar Pagamento
              </>
            )}
          </Button>
        </div>

        {verificationResult && (
          <div className="mt-4 p-4 rounded-lg border">
            {verificationResult.success ? (
              <div className="space-y-2">
                <div className="flex items-center text-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="font-medium">Verificação Concluída</span>
                </div>
                
                {verificationResult.payment_found ? (
                  <div className="space-y-1 text-sm">
                    <p><strong>Pagamento encontrado:</strong> Sim</p>
                    <p><strong>Status MP:</strong> 
                      <Badge className={`ml-2 ${getStatusColor(verificationResult.payment_status)}`}>
                        {verificationResult.payment_status}
                      </Badge>
                    </p>
                    <p><strong>Valor:</strong> R$ {verificationResult.payment_amount?.toFixed(2)}</p>
                    {verificationResult.status_updated && (
                      <p className="text-green-600 font-medium">✅ Status do pedido atualizado!</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-700">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Pagamento ainda não processado pelo Mercado Pago</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center text-red-700">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>Erro: {verificationResult.error}</span>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <p><strong>ℹ️ Como funciona:</strong></p>
          <p>• Consulta diretamente a API do Mercado Pago</p>
          <p>• Verifica se o pagamento foi aprovado</p>
          <p>• Atualiza automaticamente o status se confirmado</p>
        </div>
      </CardContent>
    </Card>
  );
};
