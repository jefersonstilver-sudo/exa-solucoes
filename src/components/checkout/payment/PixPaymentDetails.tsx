
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface PixPaymentDetailsProps {
  qrCodeBase64: string;
  qrCodeText: string;
  status: string;
  paymentId: string;
  onRefreshStatus: () => Promise<void>;
}

const PixPaymentDetails = ({
  qrCodeBase64,
  qrCodeText,
  status,
  paymentId,
  onRefreshStatus
}: PixPaymentDetailsProps) => {
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [timeLeft, setTimeLeft] = useState(60);
  
  // Handle copy to clipboard
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeText);
      setCopied(true);
      toast.success("Código PIX copiado!");
      
      // Reset copied status after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Erro ao copiar código. Tente copiar manualmente.");
    }
  };
  
  // Handle refresh status
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefreshStatus();
      toast.success("Status do pagamento atualizado");
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error refreshing payment status:", error);
      toast.error("Erro ao atualizar status");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Calculate time until next refresh is allowed
  useEffect(() => {
    const interval = setInterval(() => {
      const secondsElapsed = Math.floor((new Date().getTime() - lastRefresh.getTime()) / 1000);
      const newTimeLeft = Math.max(0, 60 - secondsElapsed);
      setTimeLeft(newTimeLeft);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastRefresh]);
  
  // Get status messages and colors
  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          title: 'Aguardando pagamento',
          description: 'Escaneie o QR code com o app do seu banco ou copie o código PIX',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100'
        };
      case 'approved':
        return {
          title: 'Pagamento aprovado!',
          description: 'Seu pagamento foi confirmado com sucesso',
          color: 'text-green-500',
          bgColor: 'bg-green-100'
        };
      case 'rejected':
        return {
          title: 'Pagamento recusado',
          description: 'Houve um problema com seu pagamento. Tente novamente ou use outro método',
          color: 'text-red-500',
          bgColor: 'bg-red-100'
        };
      default:
        return {
          title: 'Processando pagamento',
          description: 'Estamos verificando seu pagamento',
          color: 'text-blue-500',
          bgColor: 'bg-blue-100'
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center space-y-6 p-4 border rounded-lg bg-white shadow-sm"
    >
      {/* Payment Status */}
      <div className={`w-full p-4 rounded-md ${statusInfo.bgColor} flex items-center space-x-3`}>
        {status === 'approved' ? (
          <CheckCircle2 className={`h-6 w-6 ${statusInfo.color}`} />
        ) : status === 'rejected' ? (
          <AlertCircle className={`h-6 w-6 ${statusInfo.color}`} />
        ) : (
          <div className={`h-5 w-5 rounded-full ${statusInfo.color} animate-pulse`}></div>
        )}
        <div>
          <h3 className={`font-medium ${statusInfo.color}`}>{statusInfo.title}</h3>
          <p className="text-sm text-gray-600">{statusInfo.description}</p>
        </div>
      </div>
      
      {/* QR Code */}
      <div className="flex flex-col items-center space-y-2">
        <h3 className="text-lg font-medium text-gray-800">Pague com PIX</h3>
        <p className="text-sm text-gray-500 text-center">Utilize o aplicativo do seu banco para escanear o QR Code</p>
        
        <div className="border border-gray-200 p-4 rounded-lg bg-white">
          {qrCodeBase64 ? (
            <img 
              src={`data:image/png;base64,${qrCodeBase64}`} 
              alt="QR Code PIX" 
              className="w-64 h-64"
            />
          ) : (
            <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
              <p className="text-sm text-gray-500">QR Code não disponível</p>
            </div>
          )}
        </div>
      </div>
      
      {/* PIX Copy Code */}
      <div className="w-full max-w-md">
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-gray-500">Ou copie e cole o código PIX:</label>
          <div className="flex">
            <div className="bg-gray-50 border border-gray-200 rounded-l-md py-2 px-3 flex-grow overflow-hidden">
              <p className="text-sm text-gray-600 truncate">{qrCodeText || "Código PIX não disponível"}</p>
            </div>
            <Button 
              onClick={handleCopyToClipboard}
              variant="outline"
              size="sm"
              className="rounded-l-none border-l-0"
              disabled={!qrCodeText || copied}
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Refresh button */}
      <div className="w-full max-w-md">
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing || timeLeft > 0 || status === 'approved'}
          variant="outline"
          className="w-full"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
              Atualizando...
            </>
          ) : timeLeft > 0 && status !== 'approved' ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> 
              Atualizar status ({timeLeft}s)
            </>
          ) : status === 'approved' ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> 
              Pagamento confirmado
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> 
              Atualizar status
            </>
          )}
        </Button>
        
        {(status === 'pending' || status === 'in_process') && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Após realizar o pagamento, clique em "Atualizar status" para verificar a confirmação.
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default PixPaymentDetails;
