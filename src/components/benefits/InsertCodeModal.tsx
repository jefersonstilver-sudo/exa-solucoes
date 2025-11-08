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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold">Inserir Vale-Presente</DialogTitle>
          <DialogDescription className="text-sm">
            Insira o código ou link para <strong>{providerName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Info Card */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prestador:</span>
              <span className="font-medium">{providerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Presente:</span>
              <span className="font-medium">{benefitChoice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prazo:</span>
              <span className="font-medium">Até {deliveryDays} dia{deliveryDays > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Delivery Type */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tipo de Entrega</Label>
            <RadioGroup 
              value={deliveryType} 
              onValueChange={(value) => setDeliveryType(value as 'code' | 'link')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-input hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="code" id="code-type" className="mt-0" />
                <Label htmlFor="code-type" className="cursor-pointer font-normal flex-1 leading-tight">
                  Código do Vale-Presente
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-input hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="link" id="link-type" className="mt-0" />
                <Label htmlFor="link-type" className="cursor-pointer font-normal flex-1 leading-tight">
                  Link de Resgate
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Code/Link Input */}
          <div className="space-y-2">
            <Label htmlFor="code" className="text-base font-medium">
              {deliveryType === 'code' ? 'Código do Vale' : 'Link de Resgate'}
            </Label>
            <Input
              id="code"
              placeholder={deliveryType === 'code' ? 'Ex: ABCD-1234-EFGH' : 'https://exemplo.com/resgate/...'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono h-12 text-base"
              autoComplete="off"
            />
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-base font-medium">
              Instruções de Resgate <span className="text-muted-foreground font-normal text-sm">(opcional)</span>
            </Label>
            <Textarea
              id="instructions"
              placeholder="Ex: Acesse o site, clique em 'Resgatar', insira o código e pronto!"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="resize-none text-base"
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 rounded-lg">
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              💌 Um email será enviado automaticamente ao prestador com todas as informações após a confirmação.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="flex-1 sm:flex-none h-11"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!code.trim() || isLoading}
            className="flex-1 sm:flex-none h-11"
          >
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
