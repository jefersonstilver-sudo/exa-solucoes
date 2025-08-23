import { useState } from 'react';
import { AlertTriangle, Shield, FileX, Flag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface BlockOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isBlocking: boolean;
  videoName?: string;
  orderId?: string;
}

const BLOCK_REASONS = [
  {
    id: 'conteudo_inapropriado',
    label: 'Conteúdo Inapropriado',
    description: 'Conteúdo ofensivo, violento ou inadequado',
    icon: AlertTriangle,
    color: 'text-red-500'
  },
  {
    id: 'violacao_termos',
    label: 'Violação de Termos',
    description: 'Viola os termos de uso da plataforma',
    icon: FileX,
    color: 'text-orange-500'
  },
  {
    id: 'suspeita_fraude',
    label: 'Suspeita de Fraude',
    description: 'Possível tentativa de fraude ou abuso',
    icon: Shield,
    color: 'text-purple-500'
  },
  {
    id: 'pendencia_financeira',
    label: 'Pendência Financeira',
    description: 'Problemas relacionados ao pagamento ou cobrança',
    icon: Flag,
    color: 'text-yellow-600'
  },
  {
    id: 'outros',
    label: 'Outros Motivos',
    description: 'Especificar motivo customizado',
    icon: Flag,
    color: 'text-blue-500'
  }
];

export const BlockOrderModal = ({
  isOpen,
  onClose,
  onConfirm,
  isBlocking,
  videoName,
  orderId
}: BlockOrderModalProps) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    let finalReason = '';
    
    const selectedReasonData = BLOCK_REASONS.find(r => r.id === selectedReason);
    if (selectedReasonData) {
      if (selectedReason === 'pendencia_financeira') {
        finalReason = 'Pendência Financeira';
      } else if (selectedReason === 'outros' && customReason.trim()) {
        finalReason = customReason.trim();
      } else {
        finalReason = selectedReasonData.label;
      }
    }

    if (!finalReason) {
      return;
    }

    onConfirm(finalReason);
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  const isCustomSelected = selectedReason === 'outros';
  const canConfirm = selectedReason && (!isCustomSelected || customReason.trim());

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Bloquear Pedido por Segurança
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              Esta ação irá <strong>bloquear todo o pedido</strong> imediatamente por questões de segurança.
            </p>
            {videoName && (
              <p className="text-sm bg-red-50 p-2 rounded border border-red-200">
                <strong>Vídeo:</strong> {videoName}
              </p>
            )}
            {orderId && (
              <p className="text-xs text-gray-500">
                <strong>Pedido ID:</strong> {orderId}
              </p>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          <div>
            <Label className="text-base font-semibold">Motivo do Bloqueio</Label>
            <RadioGroup 
              value={selectedReason} 
              onValueChange={setSelectedReason}
              className="mt-3"
            >
              {BLOCK_REASONS.map((reason) => {
                const Icon = reason.icon;
                return (
                  <div key={reason.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value={reason.id} id={reason.id} className="mt-1" />
                    <div className="flex-1">
                      <Label 
                        htmlFor={reason.id} 
                        className="flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Icon className={`h-4 w-4 ${reason.color}`} />
                        {reason.label}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {reason.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {isCustomSelected && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Especificar Motivo</Label>
              <Textarea
                id="custom-reason"
                placeholder="Descreva o motivo específico para o bloqueio..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="min-h-[80px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">
                {customReason.length}/500 caracteres
              </p>
            </div>
          )}

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-orange-800">Atenção:</p>
                <ul className="mt-1 space-y-1 text-orange-700">
                  <li>• O cliente será notificado sobre o bloqueio</li>
                  <li>• Todos os vídeos do pedido serão desativados</li>
                  <li>• O cliente deverá contatar o suporte</li>
                  <li>• Esta ação será registrada nos logs de auditoria</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isBlocking}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!canConfirm || isBlocking}
            className="min-w-[120px]"
          >
            {isBlocking ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Bloqueando...
              </>
            ) : (
              'Bloquear Pedido'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};