import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Copy, Check, Clock } from 'lucide-react';
import { useSofiaClient } from '@/contexts/SofiaClientContext';
import { useQRCodeGenerator } from '@/hooks/useQRCodeGenerator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const SofiaQRCodePopup: React.FC = () => {
  const { currentAction, clearAction } = useSofiaClient();
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

  // Only show for QR code actions
  if (!currentAction || currentAction.type !== 'qrcode') {
    return null;
  }

  const action = currentAction;
  
  // Generate QR code URL - in production this would be the actual PIX code
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${action.pedido_id}5204000053039865802BR5913EXA MIDIA LTDA6008SAO PAULO62070503***63044B9F`;
  const { qrCodeUrl, loading: qrLoading } = useQRCodeGenerator(pixCode);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar código');
    }
  };

  const valorFormatado = action.valor?.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={clearAction}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Pagamento PIX</h3>
                <p className="text-sm text-muted-foreground">Escaneie para pagar</p>
              </div>
            </div>
            <button
              onClick={clearAction}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-xl p-4 mb-4 flex items-center justify-center">
            {qrLoading ? (
              <div className="w-48 h-48 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code PIX" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">Valor a pagar</p>
            <p className="text-2xl font-bold text-foreground">{valorFormatado}</p>
          </div>

          {/* Timer */}
          <div className={cn(
            "flex items-center justify-center gap-2 mb-4 py-2 rounded-lg",
            timeRemaining < 60 ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-600"
          )}>
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {timeRemaining > 0 ? `Expira em ${formatTime(timeRemaining)}` : 'QR Code expirado'}
            </span>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            disabled={timeRemaining === 0}
            className={cn(
              "w-full py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              copied
                ? "bg-green-500 text-white"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              timeRemaining === 0 && "opacity-50 cursor-not-allowed"
            )}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar código PIX
              </>
            )}
          </button>

          {/* Instructions */}
          <p className="text-xs text-muted-foreground text-center mt-3">
            Abra o app do seu banco, escaneie o QR code ou cole o código copiado
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SofiaQRCodePopup;
