
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Mail, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SecureAdminReset = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      toast.success('Email de redefinição enviado com sucesso!');
      setEmail('');
    } catch (error: any) {
      console.error('Erro ao enviar email de redefinição:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto my-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Redefinição Segura de Senha
        </CardTitle>
        <CardDescription>
          Use o sistema oficial de redefinição de senha por email.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Administrador</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@indexamidia.com"
              required
            />
          </div>
          
          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>Enviando...</>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email de Redefinição
              </>
            )}
          </Button>
        </form>
        
        <Alert className="mt-4">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Este método é seguro e segue as melhores práticas de segurança.
            Você receberá um link por email para redefinir sua senha.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default SecureAdminReset;
