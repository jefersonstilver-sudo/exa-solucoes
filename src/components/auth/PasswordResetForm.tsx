
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface PasswordResetFormProps {
  email: string;
  setEmail: (value: string) => void;
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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Digite seu email para redefinir a senha");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/confirmacao?type=recovery`
      });
      
      if (error) throw error;
      
      setResetSent(true);
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha."
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      setError(error.message || "Erro ao enviar email de redefinição de senha.");
      toast({
        variant: "destructive",
        title: "Erro na redefinição de senha",
        description: error.message || "Não foi possível enviar o email de redefinição."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-start"
        >
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </motion.div>
      )}
      
      <form onSubmit={handlePasswordReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email" className="flex items-center text-gray-700">
            <Mail className="h-4 w-4 mr-2 text-indexa-purple" /> Email
          </Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-indexa-purple/20 focus:border-indexa-purple"
          />
        </div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            type="submit" 
            className="w-full bg-indexa-purple hover:bg-indexa-purple-dark transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Enviando...
              </>
            ) : (
              <>
                Enviar instruções <Mail className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>
        
        <Button 
          type="button" 
          variant="outline" 
          className="w-full"
          onClick={() => setIsResetMode(false)}
        >
          Voltar ao login
        </Button>
      </form>
    </>
  );
};
