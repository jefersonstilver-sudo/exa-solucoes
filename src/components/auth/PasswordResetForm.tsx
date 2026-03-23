
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { usePasswordReset } from '@/hooks/usePasswordReset';

interface PasswordResetFormProps {
  email: string;
  setEmail: (email: string) => void;
  setIsResetMode: (value: boolean) => void;
  setResetSent: (value: boolean) => void;
}

export const PasswordResetForm = ({ 
  email, 
  setEmail, 
  setIsResetMode, 
  setResetSent 
}: PasswordResetFormProps) => {
  const { sendReset, isLoading, cooldown } = usePasswordReset(email, {
    onSuccess: () => {
      setResetSent(true);
      toast.success('Instruções enviadas para seu email!');
    }
  });

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor, informe seu email');
      return;
    }

    await sendReset();
  };

  return (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email" className="flex items-center">
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="flex flex-col space-y-2">
        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading || cooldown > 0}
        >
          {isLoading ? 'Enviando...' : cooldown > 0 ? `Aguarde ${cooldown}s` : 'Enviar instruções'}
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsResetMode(false)}
          disabled={isLoading}
          className="flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao login
        </Button>
      </div>
    </form>
  );
};
