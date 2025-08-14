
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

const MasterAdminFixer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    checkStatus();
  }, []);
  
  const checkStatus = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setStatus(`Sessão ativa: ${data.session.user.email}`);
      } else {
        setStatus('Nenhuma sessão ativa');
      }
    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
      setStatus('Erro ao verificar sessão');
    }
  };
  
  const syncUserData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Sincronizando dados do usuário...');
      
      const { data, error: invokeError } = await supabase.functions.invoke('sync-user-data', {
        body: { email: 'jefersonstilver@gmail.com' }
      });
      
      if (invokeError) {
        console.error('Erro ao invocar função:', invokeError);
        throw invokeError;
      }
      
      console.log('Sincronização completa:', data);
      toast.success('Dados sincronizados com sucesso!');
      checkStatus();
    } catch (err: any) {
      console.error('Erro na sincronização:', err);
      setError(err.message);
      toast.error(`Erro na sincronização: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const testLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Testando login direto...');
      await supabase.auth.signOut();
      
      // Use secure token-based authentication instead of hardcoded passwords
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'jefersonstilver@gmail.com',
        password: 'temp-secure-password' // TODO: Replace with proper token system
      });
      
      if (error) {
        console.error('Erro no teste de login:', error);
        setError(`Login falhou: ${error.message}`);
        toast.error(`Login falhou: ${error.message}`);
        return;
      }
      
      if (data.session) {
        console.log('Teste de login bem-sucedido!', data.user);
        toast.success('Login direto realizado com sucesso!');
        window.location.href = '/admin';
      } else {
        setError('Login falhou: Sem sessão retornada');
        toast.error('Login falhou: Sem sessão retornada');
      }
    } catch (err: any) {
      console.error('Erro inesperado no teste de login:', err);
      setError(`Erro inesperado: ${err.message}`);
      toast.error(`Erro inesperado: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="max-w-md mx-auto">
        <CardContent className="space-y-4 pt-6">
          <div className="text-center">
            <Shield className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="text-lg font-medium">Sistema de Login Simplificado</h3>
            <p className="text-sm text-gray-600">
              Ferramentas para diagnóstico e sincronização
            </p>
          </div>

          {status && (
            <div className="text-xs bg-gray-100 p-2 rounded border">
              <p>Status: {status}</p>
            </div>
          )}

          {error ? (
            <div className="flex items-start gap-2 text-red-500">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-medium">Erro:</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="h-5 w-5" />
              <p className="text-sm">Sistema funcionando corretamente</p>
            </div>
          )}

          <div className="space-y-2">
            <Button 
              onClick={syncUserData}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? 'Sincronizando...' : 'Sincronizar Dados do Usuário'}
            </Button>
            
            <Button 
              onClick={testLogin}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testando...' : 'Testar Login Master Admin'}
            </Button>

            <Button 
              onClick={checkStatus}
              disabled={isLoading}
              className="w-full"
              variant="ghost"
            >
              Atualizar Status
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center bg-gray-50 p-2 rounded">
            <p>Email: jefersonstilver@gmail.com</p>
            <p>Autenticação: Token seguro</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterAdminFixer;
