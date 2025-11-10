import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, AlertCircle, Code } from 'lucide-react';

interface ApiResponseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  response: any;
  operationType: string;
}

export const ApiResponseDialog: React.FC<ApiResponseDialogProps> = ({
  isOpen,
  onClose,
  response,
  operationType
}) => {
  if (!response) return null;

  const getStatusIcon = () => {
    if (response.success === true) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    } else if (response.success === false) {
      return <XCircle className="h-6 w-6 text-red-500" />;
    }
    return <AlertCircle className="h-6 w-6 text-yellow-500" />;
  };

  const getStatusBadge = () => {
    if (response.success === true) {
      return <Badge className="bg-green-500">Sucesso</Badge>;
    } else if (response.success === false) {
      return <Badge variant="destructive">Falha</Badge>;
    }
    return <Badge variant="secondary">Desconhecido</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <DialogTitle>Resposta da API - {operationType}</DialogTitle>
              <DialogDescription>
                Detalhes completos da operação executada
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-semibold text-foreground">Status:</span>
              {getStatusBadge()}
            </div>

            {/* Mensagem de erro (se houver) */}
            {response.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-1">Erro:</h4>
                    <p className="text-sm text-red-700">{response.error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Dados do pedido_video */}
            {response.pedido_video_id && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center space-x-2">
                  <Code className="h-4 w-4" />
                  <span>Informações do Slot:</span>
                </h4>
                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID do Slot:</span>
                    <code className="bg-background px-2 py-1 rounded text-xs font-mono">
                      {response.pedido_video_id}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {/* Dados do vídeo */}
            {response.video_id && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center space-x-2">
                  <Code className="h-4 w-4" />
                  <span>Informações do Vídeo:</span>
                </h4>
                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID do Vídeo:</span>
                    <code className="bg-background px-2 py-1 rounded text-xs font-mono">
                      {response.video_id}
                    </code>
                  </div>
                  {response.video_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome:</span>
                      <span className="font-medium text-foreground">{response.video_name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informações adicionais */}
            {response.old_base_video_id && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Vídeo Principal Anterior:</h4>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <code className="text-xs font-mono">
                    {response.old_base_video_id}
                  </code>
                </div>
              </div>
            )}

            {/* Dados de sincronização */}
            {response.buildings_synced !== undefined && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Sincronização com Prédios:</h4>
                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prédios Sincronizados:</span>
                    <Badge variant="outline">{response.buildings_synced}</Badge>
                  </div>
                  {response.external_api_calls && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chamadas à API Externa:</span>
                      <Badge variant="outline">{response.external_api_calls}</Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamp */}
            {response.timestamp && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Timestamp:</h4>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <code className="text-xs font-mono">
                    {new Date(response.timestamp).toLocaleString('pt-BR')}
                  </code>
                </div>
              </div>
            )}

            {/* JSON Completo */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground flex items-center space-x-2">
                <Code className="h-4 w-4" />
                <span>Resposta Completa (JSON):</span>
              </h4>
              <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs text-green-400 font-mono">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
