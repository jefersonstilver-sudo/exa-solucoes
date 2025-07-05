import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  QrCode, 
  Copy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { usePixPayment } from '@/hooks/payment/usePixPayment';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';

const PixPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pedidoId = searchParams.get('pedido');
  
  const {
    isLoading,
    error,
    paymentData,
    refreshPaymentStatus,
    isVerifying
  } = usePixPayment(pedidoId);

  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos
  const [isExpired, setIsExpired] = useState(false);

  // Timer para expiração do QR Code 
  useEffect(() => {
    if (paymentData?.status === 'pending' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsExpired(true);
    }
  }, [timeLeft, paymentData?.status]);

  // Função para copiar código PIX
  const copyPixCode = async () => {
    if (paymentData?.qrCode) {
      try {
        await navigator.clipboard.writeText(paymentData.qrCode);
        toast.success("Código PIX copiado!");
      } catch (error) {
        toast.error("Erro ao copiar código");
      }
    }
  };

  // Função para verificação manual
  const handleManualVerification = async () => {
    console.log("🔍 [PixPayment] Verificação manual solicitada");
    await refreshPaymentStatus();
  };

  // Formatador de tempo
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 border-4 border-[#3C1361] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando pagamento PIX...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-red-700">Erro no Pagamento</h2>
                <p className="text-red-600 mb-4">{error}</p>
                <div className="space-x-4">
                  <Button onClick={() => navigate('/')} variant="outline">
                    Voltar ao Início
                  </Button>
                  <Button onClick={handleManualVerification}>
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

  // Success state
  if (paymentData?.status === 'approved') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="text-center py-8">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-green-700">Pagamento Aprovado!</h2>
                <p className="text-green-600 mb-6">
                  Seu pagamento foi processado com sucesso. Você receberá as instruções por email.
                </p>
                <Button onClick={() => navigate('/anunciante')} className="bg-green-600 hover:bg-green-700">
                  Ir para Minha Área
                </Button>
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/checkout')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Pagamento PIX</h1>
              <p className="text-gray-600">Pedido #{pedidoId}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Área Principal do PIX */}
            <div className="lg:col-span-2">
              <Card className="h-fit">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <QrCode className="h-6 w-6 text-[#3C1361] mr-2" />
                    <CardTitle>Pague com PIX</CardTitle>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex justify-center">
                    {paymentData?.status === 'pending' && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Aguardando Pagamento
                      </Badge>
                    )}
                    {isExpired && (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        QR Code Expirado
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Timer */}
                  {!isExpired && paymentData?.status === 'pending' && (
                    <div className="text-center">
                      <div className="text-2xl font-mono font-bold text-[#3C1361] mb-2">
                        {formatTime(timeLeft)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Tempo restante para pagamento
                      </p>
                    </div>
                  )}

                  {/* QR Code */}
                  {paymentData?.qrCodeBase64 && !isExpired && (
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <img 
                          src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                          alt="QR Code PIX"
                          className="w-64 h-64 sm:w-80 sm:h-80"
                        />
                      </div>
                    </div>
                  )}

                  {/* Código PIX para Cópia */}
                  {paymentData?.qrCode && !isExpired && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 text-center">
                        Ou copie o código PIX:
                      </p>
                      <div className="flex gap-2">
                        <div className="flex-1 p-3 bg-gray-50 rounded-lg border font-mono text-sm break-all">
                          {paymentData.qrCode}
                        </div>
                        <Button 
                          onClick={copyPixCode}
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* BOTÃO PRINCIPAL DE VERIFICAÇÃO MANUAL */}
                  <div className="text-center">
                    <Button 
                      onClick={handleManualVerification}
                      disabled={isVerifying}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      {isVerifying ? (
                        <>
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Verificando no MercadoPago...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Confirmar Pagamento
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Clique após realizar o pagamento PIX
                    </p>
                  </div>

                  {/* Instruções */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Como pagar:</h3>
                    <ol className="text-sm text-blue-800 space-y-1">
                      <li>1. Abra o app do seu banco</li>
                      <li>2. Escaneie o QR Code ou cole o código PIX</li>
                      <li>3. Confirme o pagamento</li>
                      <li>4. Clique em "Confirmar Pagamento" acima</li>
                    </ol>
                  </div>

                  {/* QR Code Expirado */}
                  {isExpired && (
                    <div className="text-center space-y-4">
                      <AlertCircle className="h-12 w-12 mx-auto text-yellow-500" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">QR Code Expirado</h3>
                        <p className="text-gray-600 mb-4">
                          O QR Code PIX expirou. Gere um novo para continuar com o pagamento.
                        </p>
                        <Button onClick={handleManualVerification} disabled={isVerifying}>
                          {isVerifying && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                          Gerar Novo QR Code
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Resumo do Pedido */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valor:</span>
                      <span>{formatCurrency(paymentData?.valorTotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto PIX:</span>
                      <span>-5%</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-[#3C1361]">
                      {formatCurrency(paymentData?.valorTotal || 0)}
                    </span>
                  </div>

                  <div className="pt-4 space-y-2 text-sm text-gray-600">
                    <p><strong>Pedido:</strong> #{pedidoId}</p>
                    <p><strong>Método:</strong> PIX</p>
                    <p><strong>Status:</strong> {paymentData?.status === 'pending' ? 'Aguardando' : 'Processando'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PixPayment;
