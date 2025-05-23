
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Shield, Key, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const EmergencyAdminAccess = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);

  const forcePasswordReset = async () => {
    setIsResetting(true);
    setResetResult(null);
    
    try {
      console.log('Iniciando reset de senha de emergência...');
      
      // Call the edge function to force a password reset
      const response = await fetch('https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/emergency-admin-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk'
        },
        body: JSON.stringify({
          email: 'jefersonstilver@gmail.com',
          newPassword: '573039'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao resetar senha');
      }
      
      setResetResult('Senha resetada com sucesso! Tente fazer login novamente.');
      toast.success('Senha do admin master resetada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao resetar senha:', err);
      setResetResult(`Erro: ${err.message}`);
      toast.error(`Erro ao resetar senha: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const testDirectLogin = async () => {
    try {
      console.log('Testando login direto...');
      
      // Clear any existing session first
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'jefersonstilver@gmail.com',
        password: '573039'
      });
      
      if (error) {
        console.error('Erro no teste de login:', error);
        toast.error(`Login falhou: ${error.message}`);
        return;
      }
      
      if (data.session) {
        console.log('Login de teste bem-sucedido!', data.user);
        toast.success('Login de teste realizado com sucesso!');
        window.location.href = '/admin';
      } else {
        toast.error('Login falhou: Sem sessão retornada');
      }
    } catch (err: any) {
      console.error('Erro inesperado no teste de login:', err);
      toast.error(`Erro inesperado: ${err.message}`);
    }
  };

  return (
    <Card className="max-w-md mx-auto my-4 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <AlertTriangle className="h-5 w-5" />
          Acesso de Emergência
        </CardTitle>
        <CardDescription>
          Ferramentas de emergência para corrigir problemas de login do admin master.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {resetResult && (
          <Alert className={resetResult.includes('Erro') ? 'border-red-200' : 'border-green-200'}>
            <AlertDescription className={resetResult.includes('Erro') ? 'text-red-700' : 'text-green-700'}>
              {resetResult}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Button 
            onClick={forcePasswordReset}
            disabled={isResetting}
            className="w-full"
            variant="destructive"
          >
            {isResetting ? (
              <>Resetando Senha...</>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Forçar Reset de Senha
              </>
            )}
          </Button>
          
          <Button 
            onClick={testDirectLogin}
            disabled={isResetting}
            className="w-full"
            variant="secondary"
          >
            <Shield className="mr-2 h-4 w-4" />
            Testar Login Direto
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <p><strong>Email:</strong> jefersonstilver@gmail.com</p>
          <p><strong>Senha:</strong> 573039</p>
          <p><strong>Função:</strong> Super Administrador</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergencyAdminAccess;
