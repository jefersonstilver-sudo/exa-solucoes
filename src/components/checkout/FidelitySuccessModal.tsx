import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, Download, Copy, ExternalLink, PartyPopper } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface FidelitySuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: string;
  totalParcelas: number;
  valorMensal: number;
  proximoVencimento: string;
  boletoUrl?: string | null;
  boletoBarcode?: string | null;
  onNavigateToInvoices: () => void;
}

const FidelitySuccessModal: React.FC<FidelitySuccessModalProps> = ({
  isOpen,
  onClose,
  pedidoId,
  totalParcelas,
  valorMensal,
  proximoVencimento,
  boletoUrl,
  boletoBarcode,
  onNavigateToInvoices
}) => {
  const handleCopyBarcode = () => {
    if (boletoBarcode) {
      navigator.clipboard.writeText(boletoBarcode);
      toast.success('Código de barras copiado!');
    }
  };

  const handleOpenBoleto = () => {
    if (boletoUrl) {
      window.open(boletoUrl, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Plano criado com sucesso</DialogTitle>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          {/* Ícone de sucesso */}
          <div className="relative mx-auto w-20 h-20 mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="absolute inset-0 bg-green-100 rounded-full"
            />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="absolute inset-2 bg-green-500 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute -top-2 -right-2"
            >
              <PartyPopper className="h-8 w-8 text-amber-500" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Parabéns pela compra! 🎉
            </h2>
            <p className="text-gray-600 mb-6">
              Seu plano de fidelidade foi criado com sucesso.
            </p>
          </motion.div>

          {/* Resumo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-50 rounded-xl p-4 mb-6 text-left"
          >
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Pedido</p>
                <p className="font-semibold">#{pedidoId.substring(0, 8)}</p>
              </div>
              <div>
                <p className="text-gray-500">Parcelas</p>
                <p className="font-semibold">{totalParcelas}x</p>
              </div>
              <div>
                <p className="text-gray-500">Valor Mensal</p>
                <p className="font-semibold text-green-600">{formatCurrency(valorMensal)}</p>
              </div>
              <div>
                <p className="text-gray-500">Vencimento</p>
                <p className="font-semibold">
                  {new Date(proximoVencimento).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Primeira Parcela */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="border-2 border-amber-200 bg-amber-50 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">Primeira Parcela</h3>
            </div>
            
            <p className="text-sm text-amber-700 mb-4">
              Pague a primeira parcela para ativar seu plano e liberar o envio de vídeos.
            </p>

            {boletoUrl ? (
              <div className="space-y-3">
                <Button
                  onClick={handleOpenBoleto}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Boleto
                </Button>
                
                {boletoBarcode && (
                  <div className="relative">
                    <p className="text-xs text-gray-500 mb-1">Código de barras:</p>
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 border">
                      <code className="text-xs flex-1 overflow-hidden text-ellipsis">
                        {boletoBarcode.substring(0, 30)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyBarcode}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Acesse suas faturas para gerar o boleto ou PIX.
              </p>
            )}
          </motion.div>

          {/* Botões de Ação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button
              onClick={onNavigateToInvoices}
              className="w-full"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Minhas Faturas
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Fechar
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default FidelitySuccessModal;
