import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Installment {
  due_date: string;
  amount: number;
}

interface EditPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPaymentType: string;
  currentInstallments: Installment[];
  totalValue: number;
  onSave: (paymentType: string, installments: Installment[]) => Promise<void>;
  isSubmitting: boolean;
}

export const EditPaymentDialog: React.FC<EditPaymentDialogProps> = ({
  open,
  onOpenChange,
  currentPaymentType,
  currentInstallments,
  totalValue,
  onSave,
  isSubmitting
}) => {
  const [paymentType, setPaymentType] = useState(currentPaymentType || 'cash');
  const [installments, setInstallments] = useState<Installment[]>(currentInstallments || []);

  useEffect(() => {
    if (open) {
      setPaymentType(currentPaymentType || 'cash');
      setInstallments(currentInstallments?.length > 0 ? currentInstallments : []);
    }
  }, [open, currentPaymentType, currentInstallments]);

  const addInstallment = () => {
    const lastDate = installments.length > 0 
      ? new Date(installments[installments.length - 1].due_date)
      : new Date();
    lastDate.setMonth(lastDate.getMonth() + 1);
    
    const remainingValue = totalValue - installments.reduce((sum, inst) => sum + inst.amount, 0);
    
    setInstallments([...installments, {
      due_date: lastDate.toISOString().split('T')[0],
      amount: Math.max(0, remainingValue)
    }]);
  };

  const removeInstallment = (index: number) => {
    setInstallments(installments.filter((_, i) => i !== index));
  };

  const updateInstallment = (index: number, field: 'due_date' | 'amount', value: string | number) => {
    const updated = [...installments];
    updated[index] = { ...updated[index], [field]: value };
    setInstallments(updated);
  };

  const handleSave = async () => {
    await onSave(paymentType, paymentType === 'custom' ? installments : []);
  };

  const totalInstallments = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);

  const formatCurrency = (value: number) => {
    return value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Editar Condição de Pagamento</DialogTitle>
          <DialogDescription className="text-xs">
            Valor total da proposta: {formatCurrency(totalValue)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <RadioGroup value={paymentType} onValueChange={setPaymentType}>
            <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="text-sm flex-1 cursor-pointer">
                Pagamento à Vista
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="fidelity" id="fidelity" />
              <Label htmlFor="fidelity" className="text-sm flex-1 cursor-pointer">
                Fidelidade Mensal
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="text-sm flex-1 cursor-pointer">
                Pagamento Personalizado
              </Label>
            </div>
          </RadioGroup>

          {paymentType === 'custom' && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Parcelas Personalizadas</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInstallment}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {installments.map((inst, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <span className="text-xs font-bold text-muted-foreground w-6">{idx + 1}ª</span>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 text-xs flex-1 justify-start font-normal",
                            !inst.due_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-1.5 h-3 w-3" />
                          {inst.due_date 
                            ? format(new Date(inst.due_date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })
                            : "Data"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={inst.due_date ? new Date(inst.due_date + 'T12:00:00') : undefined}
                          onSelect={(date) => date && updateInstallment(idx, 'due_date', format(date, 'yyyy-MM-dd'))}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        value={inst.amount || ''}
                        onChange={(e) => updateInstallment(idx, 'amount', parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs pl-8"
                        placeholder="Valor"
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInstallment(idx)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {installments.length > 0 && (
                <div className="flex justify-between items-center pt-2 border-t text-xs">
                  <span className="text-muted-foreground">Total das parcelas:</span>
                  <span className={cn(
                    "font-bold",
                    Math.abs(totalInstallments - totalValue) > 0.01 ? "text-amber-600" : "text-emerald-600"
                  )}>
                    {formatCurrency(totalInstallments)}
                  </span>
                </div>
              )}
              
              {Math.abs(totalInstallments - totalValue) > 0.01 && installments.length > 0 && (
                <p className="text-[10px] text-amber-600">
                  ⚠️ O total das parcelas difere do valor da proposta em {formatCurrency(Math.abs(totalInstallments - totalValue))}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting || (paymentType === 'custom' && installments.length === 0)}
            className="bg-[#9C1E1E] hover:bg-[#7D1818]"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPaymentDialog;
