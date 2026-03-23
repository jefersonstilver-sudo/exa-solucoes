
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { extractWaitSeconds, isRateLimitError, DEFAULT_COOLDOWN_SECONDS } from '@/utils/resetPasswordCooldown';

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
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor, informe seu email');
      return;
    }

    if (cooldown > 0) return;

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        if (isRateLimitError(error)) {
          const wait = extractWaitSeconds(error.message) || 60;
          startCooldown(wait);
          toast.error(`Aguarde ${wait} segundos antes de tentar novamente`);
          return;
        }
        throw error;
      }

      startCooldown(DEFAULT_COOLDOWN_SECONDS);
      setResetSent(true);
      toast.success('Instruções enviadas para seu email!');
    } catch (error: any) {
      console.error('Erro ao enviar email de redefinição:', error);
      toast.error('Erro ao enviar email. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
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
