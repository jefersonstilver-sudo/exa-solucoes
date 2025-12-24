import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

interface CardConfigPopoverProps {
  label: string;
  unit: string;
  value: number;
  onSave: (value: number) => Promise<boolean>;
  min?: number;
  max?: number;
}

const CardConfigPopover: React.FC<CardConfigPopoverProps> = ({
  label,
  unit,
  value,
  onSave,
  min = 1,
  max = 365
}) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    const numValue = parseInt(inputValue);
    
    if (isNaN(numValue) || numValue < min || numValue > max) {
      toast.error(`Valor deve ser entre ${min} e ${max}`);
      return;
    }

    setSaving(true);
    const success = await onSave(numValue);
    setSaving(false);

    if (success) {
      toast.success('Configuração salva');
      setOpen(false);
    } else {
      toast.error('Erro ao salvar');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-50 hover:opacity-100 transition-opacity"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground">
            {label}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-8 text-sm"
              min={min}
              max={max}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {unit}
            </span>
          </div>
          <Button
            size="sm"
            className="w-full h-7 text-xs"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CardConfigPopover;
