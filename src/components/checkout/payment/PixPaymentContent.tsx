
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Copy, Clock, CheckCircle } from 'lucide-react';
import { QRCodeDisplay } from './QRCodeDisplay';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';
import { toast } from 'sonner';

interface PixPaymentContentProps {
  paymentData: PixPaymentData;
  onBack: () => void;
  onRefreshStatus: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  pedidoId: string | null;
}

const PixPaymentContent = ({
  paymentData,
  onBack,
  onRefreshStatus,
  isLoading,
  error,
  pedidoId
}: PixPaymentContentProps) => {
  const handleCopyPixCode = () => {
    if (paymentData.qrCode) {
      navigator.clipboard.writeText(paymentData.qrCode);
      toast.success('Código PIX copiado!');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = () => {
    switch (paymentData.status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Processando</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pagamento via PIX
          </h1>
          <p className="text-gray-600">
            Escaneie o QR Code ou copie o código para finalizar seu pagamento
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* QR Code Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2">
                  <svg viewBox="0 0 512 512" className="h-6 w-6 text-green-600" fill="currentColor">
                    <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z"/>
                  </svg>
                  <span>QR Code PIX</span>
                </CardTitle>
                <CardDescription>
                  Escaneie com o app do seu banco
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <QRCodeDisplay qrCodeBase64={paymentData.qrCodeBase64} />
                
                {paymentData.qrCode && (
                  <Button
                    onClick={handleCopyPixCode}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar código PIX
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            
            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Detalhes do Pagamento</span>
                  {getStatusBadge()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-semibold text-lg">
                    {paymentData.valorTotal ? formatCurrency(paymentData.valorTotal * 0.95) : 'R$ 0,00'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Pedido:</span>
                  <span className="font-mono text-sm">{pedidoId}</span>
                </div>
                
                {paymentData.paymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID Pagamento:</span>
                    <span className="font-mono text-sm">{paymentData.paymentId}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="capitalize">{paymentData.status || 'Pendente'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Como pagar</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-[#3C1361] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Abra o app do seu banco</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-[#3C1361] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Escaneie o QR Code ou copie o código PIX</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-[#3C1361] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Confirme o pagamento</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
                      <CheckCircle className="h-3 w-3" />
                    </span>
                    <span>Pronto! Seu pagamento será processado automaticamente</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={onRefreshStatus}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verificar Status do Pagamento
                  </>
                )}
              </Button>
              
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PixPaymentContent;
