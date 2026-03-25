import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const COLOR_OPTIONS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6',
  '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6', '#F43F5E',
];

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (nome: string, cor: string) => void;
  initialName?: string;
  initialColor?: string;
  title?: string;
}

export const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialName = '',
  initialColor = '#6B7280',
  title = 'Criar Grupo',
}) => {
  const [nome, setNome] = useState(initialName);
  const [cor, setCor] = useState(initialColor);

  const handleConfirm = () => {
    if (!nome.trim()) return;
    onConfirm(nome.trim(), cor);
    setNome('');
    setCor('#6B7280');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="group-name">Nome do grupo</Label>
            <Input
              id="group-name"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Campanha Janeiro"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    cor === c ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setCor(c)}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!nome.trim()}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
