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
import { Loader2 } from 'lucide-react';

interface InsertCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (code: string) => Promise<void>;
  providerName: string;
  benefitChoice: string;
}

const InsertCodeModal: React.FC<InsertCodeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  providerName,
  benefitChoice,
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!code.trim()) return;
    
    setIsLoading(true);
    try {
      await onConfirm(code);
      setCode('');
      onClose();
    } catch (error) {
      console.error('Erro ao inserir código:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inserir Código do Vale-Presente</DialogTitle>
          <DialogDescription>
            Insira o código do vale-presente comprado na Smash.Gift para <strong>{providerName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Prestador:</strong> {providerName}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Presente escolhido:</strong> {benefitChoice}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Código do Vale</Label>
            <Input
              id="code"
              placeholder="Ex: ABCD-1234-EFGH"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Após confirmar, um email será enviado automaticamente ao prestador.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!code.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Confirmar e Enviar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InsertCodeModal;
