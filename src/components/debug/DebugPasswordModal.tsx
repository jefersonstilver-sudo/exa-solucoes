import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

interface DebugPasswordModalProps {
  open: boolean;
  onCorrectPassword: () => void;
  onClose: () => void;
}

// Senha hardcoded para debug (pode ser movida para env futuramente)
const DEBUG_PASSWORD = 'jefersonstilver';

export const DebugPasswordModal: React.FC<DebugPasswordModalProps> = ({
  open,
  onCorrectPassword,
  onClose
}) => {
  const [password, setPassword] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);

    setTimeout(() => {
      if (password === DEBUG_PASSWORD) {
        toast.success('🔓 Acesso liberado ao modo debug');
        onCorrectPassword();
        setPassword('');
      } else {
        toast.error('❌ Senha incorreta');
      }
      setIsChecking(false);
    }, 300);
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Autenticação Debug
          </DialogTitle>
          <DialogDescription>
            Digite a senha para acessar o modo debug avançado
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Digite a senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!password || isChecking}
              className="flex-1"
            >
              {isChecking ? 'Verificando...' : 'Entrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
