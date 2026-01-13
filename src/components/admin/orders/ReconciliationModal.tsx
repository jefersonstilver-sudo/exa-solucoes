import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  FileCheck,
  Package,
  CreditCard,
  Loader2
} from 'lucide-react';
import { ReconciliationResult } from '@/hooks/useOrdersReconciliationComplete';

interface ReconciliationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ReconciliationResult | null;
  isReconciling: boolean;
  onReconcile: () => void;
  onRefresh?: () => void;
}

const ReconciliationModal: React.FC<ReconciliationModalProps> = ({
  open,
  onOpenChange,
  result,
  isReconciling,
  onReconcile,
  onRefresh
}) => {
  const handleClose = () => {
    onOpenChange(false);
    if (result?.summary && (result.summary.pedidosCorrigidos > 0 || result.summary.parcelasCorrigidas > 0)) {
      onRefresh?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileCheck className="h-5 w-5 text-primary" />
            Reconciliação de Pedidos
          </DialogTitle>
          <DialogDescription>
            Sincroniza pagamentos do ASAAS com pedidos e parcelas do sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botão de Execução */}
          {!result && (
            <div className="bg-muted/50 rounded-lg p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-primary/10">
                  <RefreshCw className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Auditar e Sincronizar</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta ação irá verificar todos os pagamentos confirmados no ASAAS 
                  e corrigir status de pedidos e parcelas que não foram atualizados.
                </p>
              </div>
              <Button 
                onClick={onReconcile}
                disabled={isReconciling}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isReconciling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Executar Reconciliação
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isReconciling && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analisando pagamentos e atualizando registros...</p>
            </div>
          )}

          {/* Resultado */}
          {result && !isReconciling && (
            <ScrollArea className="max-h-[55vh]">
              <div className="space-y-4 pr-4">
                {/* Status Geral */}
                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {result.success ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {result.success ? 'Reconciliação Concluída' : 'Reconciliação com Erros'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(result.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Resumo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                    <Package className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-2xl font-bold">{result.summary.pedidosPendentesAntes}</p>
                    <p className="text-xs text-muted-foreground">Pendentes (antes)</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                    <CreditCard className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <p className="text-2xl font-bold">{result.summary.pagamentosAsaas}</p>
                    <p className="text-xs text-muted-foreground">Pagtos ASAAS</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <p className="text-2xl font-bold text-green-700">{result.summary.pedidosCorrigidos}</p>
                    <p className="text-xs text-green-600">Pedidos Corrigidos</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <p className="text-2xl font-bold text-green-700">{result.summary.parcelasCorrigidas}</p>
                    <p className="text-xs text-green-600">Parcelas Corrigidas</p>
                  </div>
                </div>

                {/* Detalhes - Pedidos */}
                {result.detalhes.pedidos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Pedidos Atualizados ({result.detalhes.pedidos.length})
                    </h4>
                    <div className="space-y-2">
                      {result.detalhes.pedidos.map((pedido, idx) => (
                        <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <code className="text-xs bg-green-100 px-2 py-1 rounded">
                              {pedido.id.substring(0, 8)}...
                            </code>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-red-50 text-red-700">
                                {pedido.statusAnterior}
                              </Badge>
                              <span>→</span>
                              <Badge className="bg-green-600">
                                {pedido.statusNovo}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{pedido.motivo}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detalhes - Parcelas */}
                {result.detalhes.parcelas.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Parcelas Atualizadas ({result.detalhes.parcelas.length})
                    </h4>
                    <div className="space-y-2">
                      {result.detalhes.parcelas.map((parcela, idx) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Parcela {parcela.numeroParcela}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                {parcela.statusAnterior}
                              </Badge>
                              <span>→</span>
                              <Badge className="bg-green-600">
                                {parcela.statusNovo}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Erros */}
                {result.detalhes.erros.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      Erros ({result.detalhes.erros.length})
                    </h4>
                    <div className="space-y-2">
                      {result.detalhes.erros.map((erro, idx) => (
                        <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">{erro.tipo}</Badge>
                            <span>{erro.mensagem}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nenhuma alteração */}
                {result.summary.pedidosCorrigidos === 0 && 
                 result.summary.parcelasCorrigidas === 0 && 
                 result.summary.erros === 0 && (
                  <div className="text-center py-6">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                    <p className="font-medium">Tudo sincronizado!</p>
                    <p className="text-sm text-muted-foreground">
                      Não foram encontradas divergências entre pagamentos e pedidos.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <Separator />

          {/* Ações */}
          <div className="flex justify-end gap-2">
            {result && (
              <Button 
                variant="outline" 
                onClick={() => {
                  onReconcile();
                }}
                disabled={isReconciling}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Executar Novamente
              </Button>
            )}
            <Button onClick={handleClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReconciliationModal;
