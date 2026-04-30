import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ReAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  action: 'activate' | 'deactivate';
}

export const ReAuthModal: React.FC<ReAuthModalProps> = ({ open, onClose, onSuccess, action }) => {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);

  const isBlocked = blockedUntil && new Date() < blockedUntil;

  const handleReAuth = async () => {
    if (isBlocked) {
      setError('Muitas tentativas falhadas. Aguarde 1 minuto.');
      return;
    }

    if (!password) {
      setError('Por favor, digite sua senha');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Re-autenticar o usuário
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: password,
      });

      if (authError) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
          const blockTime = new Date(Date.now() + 60000); // 1 minuto
          setBlockedUntil(blockTime);
          setError('Muitas tentativas falhadas. Bloqueado por 1 minuto.');
        } else {
          setError(`Senha incorreta. ${3 - newAttempts} tentativas restantes.`);
        }
        return;
      }

      // Sucesso - executar onSuccess ANTES de fechar modal
      console.log('🔐 Senha verificada com sucesso!');
      await onSuccess();
      onClose();
      setPassword('');
      setAttempts(0);
      setBlockedUntil(null);
    } catch (err) {
      console.error('Re-auth error:', err);
      setError('Erro ao verificar senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {action === 'activate' ? 'Ativar' : 'Desativar'} Debug com IA
          </DialogTitle>
          <DialogDescription>
            Esta é uma ação crítica que requer confirmação de segurança.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive" className="border-amber-500 bg-amber-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm text-amber-900">
              {action === 'activate' ? (
                <>
                  <strong>ATENÇÃO:</strong> Ativar o Debug com IA irá:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Consumir créditos de IA</li>
                    <li>Analisar profundamente cada página</li>
                    <li>Registrar tudo em logs permanentes</li>
                  </ul>
                </>
              ) : (
                <>
                  <strong>ATENÇÃO:</strong> Desativar o Debug com IA irá remover o botão de debug para todos os usuários.
                </>
              )}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Confirme sua senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReAuth()}
              disabled={isLoading || isBlocked}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isBlocked && (
            <div className="text-sm text-muted-foreground text-center">
              Bloqueado. Aguarde {Math.ceil((blockedUntil!.getTime() - Date.now()) / 1000)}s
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleReAuth} 
            disabled={isLoading || isBlocked || !password}
            variant={action === 'activate' ? 'default' : 'destructive'}
          >
            {isLoading ? 'Verificando...' : action === 'activate' ? '✓ Ativar Debug AI' : '✗ Desativar Debug AI'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
