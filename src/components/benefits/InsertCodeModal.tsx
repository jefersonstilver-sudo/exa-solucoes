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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

interface InsertCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { code: string; deliveryType: 'code' | 'link'; instructions: string }) => Promise<void>;
  providerName: string;
  benefitChoice: string;
  deliveryDays?: number;
}

const InsertCodeModal: React.FC<InsertCodeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  providerName,
  benefitChoice,
  deliveryDays = 3,
}) => {
  const [code, setCode] = useState('');
  const [deliveryType, setDeliveryType] = useState<'code' | 'link'>('code');
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!code.trim()) return;
    
    setIsLoading(true);
    try {
      await onConfirm({ code, deliveryType, instructions });
      setCode('');
      setInstructions('');
      setDeliveryType('code');
      onClose();
    } catch (error) {
      console.error('Erro ao inserir código:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inserir Código/Link do Vale-Presente</DialogTitle>
          <DialogDescription>
            Insira o código ou link do vale-presente para <strong>{providerName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Prestador:</strong> {providerName}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Presente escolhido:</strong> {benefitChoice}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Prazo de entrega:</strong> Até {deliveryDays} dia{deliveryDays > 1 ? 's' : ''} útil{deliveryDays > 1 ? 'eis' : ''}
            </p>
          </div>

          <div className="space-y-3">
            <Label>Tipo de Entrega</Label>
            <RadioGroup value={deliveryType} onValueChange={(value) => setDeliveryType(value as 'code' | 'link')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="code" id="code-type" />
                <Label htmlFor="code-type" className="cursor-pointer font-normal">
                  Código do Vale-Presente
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="link" id="link-type" />
                <Label htmlFor="link-type" className="cursor-pointer font-normal">
                  Link de Resgate
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">
              {deliveryType === 'code' ? 'Código do Vale' : 'Link de Resgate'}
            </Label>
            <Input
              id="code"
              placeholder={deliveryType === 'code' ? 'Ex: ABCD-1234-EFGH' : 'https://exemplo.com/resgate/...'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instruções de Resgate</Label>
            <Textarea
              id="instructions"
              placeholder="Ex: Acesse o site, clique em 'Resgatar', insira o código e pronto!"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Essas instruções serão enviadas por email ao prestador junto com o código/link.
            </p>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              ⚠️ Após confirmar, um email será enviado automaticamente ao prestador com todas as informações.
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
