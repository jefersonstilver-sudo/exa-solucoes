import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => Promise<void>;
  selectedOrders: (OrderOrAttempt & { daysRemaining?: number | null })[];
  loading: boolean;
}

const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedOrders,
  loading
}) => {
  const [justification, setJustification] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<'details' | 'confirm'>('details');

  const handleClose = () => {
    setStep('details');
    setJustification('');
    setConfirmText('');
    onClose();
  };

  const handleNextStep = () => {
    if (justification.trim().length >= 10) {
      setStep('confirm');
    }
  };

  const handleConfirm = async () => {
    if (confirmText === 'CONFIRMAR' && justification.trim().length >= 10) {
      await onConfirm(justification);
      handleClose();
    }
  };

  const canProceed = justification.trim().length >= 10;
  const canConfirm = confirmText === 'CONFIRMAR';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmação de Exclusão em Massa
          </DialogTitle>
          <DialogDescription>
            {step === 'details' 
              ? 'Você está prestes a excluir permanentemente os pedidos e tentativas selecionadas.'
              : 'Confirmação final necessária para prosseguir com a exclusão.'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'details' && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">
                Itens que serão excluídos ({selectedOrders.length}):
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono">{order.id.substring(0, 8)}...</span>
                    <Badge variant={order.type === 'order' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Atenção:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Esta ação é <strong>irreversível</strong></li>
                <li>• Todos os vídeos e dados relacionados serão excluídos</li>
                <li>• A operação será registrada para auditoria</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">
                Justificativa <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="justification"
                placeholder="Descreva o motivo da exclusão em massa (mínimo 10 caracteres)"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="min-h-20"
              />
              <p className="text-xs text-gray-500">
                {justification.length}/10 caracteres mínimos
              </p>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <h4 className="font-bold text-red-800 mb-2">CONFIRMAÇÃO FINAL</h4>
              <p className="text-red-700 mb-3">
                Para prosseguir com a exclusão de <strong>{selectedOrders.length} item(s)</strong>, 
                digite <strong>CONFIRMAR</strong> no campo abaixo:
              </p>
              <Input
                placeholder="Digite CONFIRMAR"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="font-mono text-center"
              />
            </div>

            <div className="bg-gray-50 p-3 rounded text-sm">
              <strong>Justificativa:</strong> {justification}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          
          {step === 'details' && (
            <Button 
              onClick={handleNextStep} 
              disabled={!canProceed || loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Continuar
            </Button>
          )}

          {step === 'confirm' && (
            <Button 
              onClick={handleConfirm} 
              disabled={!canConfirm || loading}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {loading ? 'Excluindo...' : 'Excluir Permanentemente'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkDeleteModal;