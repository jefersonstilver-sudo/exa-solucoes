
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { usePixPayment } from '@/hooks/payment/usePixPayment';
import { formatCurrency } from '@/utils/formatters';
import PixPaymentRealtimeWrapper from '@/components/checkout/payment/PixPaymentRealtimeWrapper';
import { useAuth } from '@/hooks/useAuth';

const PixPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pedidoId = searchParams.get('pedido');
  const { user } = useAuth();
  
  const {
    isLoading,
    error,
    paymentData,
    refreshPaymentStatus
  } = usePixPayment(pedidoId);

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando pagamento PIX...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !paymentData) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-destructive">Erro no Pagamento</h2>
                <p className="text-destructive/80 mb-4">{error || "Dados de pagamento não encontrados"}</p>
                <div className="space-x-4">
                  <Button onClick={() => navigate('/')} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao Início
                  </Button>
                  <Button onClick={refreshPaymentStatus}>
                    Tentar Novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Pagamento PIX
              </h1>
              <p className="text-muted-foreground">
                Escaneie o QR Code ou copie o código para pagar
              </p>
            </div>
          </div>

          {/* Payment Card */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              {/* Valor Total */}
              <div className="text-center mb-6 pb-6 border-b border-border">
                <p className="text-sm text-muted-foreground mb-2">Valor Total</p>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(paymentData.valorTotal)}
                </p>
              </div>

              {/* ✅ SISTEMA COMPLETO DE MONITORAMENTO */}
              {/* Inclui: Polling + Realtime + Timer + Status + Som */}
              <PixPaymentRealtimeWrapper
                qrCodeBase64={paymentData.qrCodeBase64}
                qrCodeText={paymentData.qrCode}
                status={paymentData.status}
                paymentId={paymentData.paymentId}
                userId={user?.id}
                pedidoId={pedidoId || undefined}
                onRefreshStatus={refreshPaymentStatus}
              />

              {/* Informações Adicionais */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">ID do Pedido</span>
                    <span className="font-mono text-foreground">{pedidoId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">ID do Pagamento</span>
                    <span className="font-mono text-foreground">{paymentData.paymentId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-semibold text-primary capitalize">
                      {paymentData.status === 'pending' ? 'Aguardando Pagamento' : 
                       paymentData.status === 'approved' ? 'Aprovado' : 
                       paymentData.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instruções */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Como pagar:</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar com PIX QR Code</li>
                  <li>Escaneie o código acima</li>
                  <li>Confirme o pagamento</li>
                  <li>Aguarde a confirmação automática (até 30 segundos)</li>
                </ol>
                
                <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-xs text-foreground/80">
                    💡 <strong>Sistema de monitoramento ativo!</strong> Assim que você pagar, receberá uma notificação sonora e será redirecionado automaticamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PixPayment;
