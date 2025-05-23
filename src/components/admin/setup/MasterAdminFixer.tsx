
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Shield, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserSession } from '@/hooks/useUserSession';
import { supabase } from '@/integrations/supabase/client';

const MasterAdminFixer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [localAuthCheck, setLocalAuthCheck] = useState<string | null>(null);
  const { user } = useUserSession();
  
  // Check local auth session on component load
  useEffect(() => {
    const checkLocalAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const authStatus = data.session 
          ? `Sessão local: ${data.session.user.email} (${data.session.user.id})`
          : 'Sem sessão local';
        setLocalAuthCheck(authStatus);
        console.log('Auth check:', authStatus);
      } catch (err) {
        console.error('Erro ao verificar sessão:', err);
        setLocalAuthCheck('Erro ao verificar sessão');
      }
    };
    
    checkLocalAuth();
  }, []);
  
  const fixMasterAdmin = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Iniciando verificação do admin master...');
      const response = await fetch('https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/fix-master-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk'
        }
      });
      
      // Log response status
      console.log('Status da resposta:', response.status);
      
      const data = await response.json();
      console.log('Resposta completa:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao corrigir admin master');
      }
      
      setResult(data);
      toast.success(`Usuário admin master ${data.action === 'created' ? 'criado' : 'atualizado'} com sucesso!`);
      
      // Try to clear local session after successful fix
      try {
        await supabase.auth.signOut();
        console.log('Sessão local limpa para garantir login limpo');
        toast.info('Sessão limpa. Por favor faça login novamente.');
      } catch (err) {
        console.error('Erro ao limpar sessão:', err);
      }
    } catch (err: any) {
      console.error('Erro ao corrigir admin master:', err);
      setError(err.message);
      toast.error(`Erro ao corrigir admin master: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loginDirectly = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Tentando login direto...');
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'jefersonstilver@gmail.com',
        password: '573039'
      });
      
      if (error) {
        console.error('Erro login direto:', error);
        setError(`Login falhou: ${error.message}`);
        toast.error(`Login falhou: ${error.message}`);
        return;
      }
      
      if (data.session) {
        console.log('Login direto bem-sucedido!', data.user);
        toast.success('Login direto realizado com sucesso!');
        window.location.href = '/admin'; // Redireciona para a área admin
      } else {
        setError('Login falhou: Sem sessão retornada');
        toast.error('Login falhou: Sem sessão retornada');
      }
    } catch (err: any) {
      console.error('Erro inesperado no login direto:', err);
      setError(`Erro inesperado: ${err.message}`);
      toast.error(`Erro inesperado: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="max-w-md mx-auto my-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="text-red-500" />
          Corrigir Usuário Master
        </CardTitle>
        <CardDescription>
          Corrija problemas de autenticação do usuário administrador master.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {localAuthCheck && (
          <div className="text-xs bg-gray-100 p-2 rounded border border-gray-300 mb-2">
            <p>Status da autenticação: {localAuthCheck}</p>
            {user && (
              <p>Usuário atual: {user.email} (Role: {user.role || 'desconhecido'})</p>
            )}
          </div>
        )}
        
        {result ? (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">{result.message}</p>
              <p className="text-sm text-gray-600">
                Email: {result.user?.email}
              </p>
              {result.confirmed !== undefined && (
                <p className="text-sm text-gray-600">
                  Email confirmado: {result.confirmed ? 'Sim' : 'Não'}
                </p>
              )}
            </div>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-red-500">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Erro:</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Clique para verificar e corrigir o usuário master.
            </p>
            <p className="text-xs text-gray-500">
              Email: jefersonstilver@gmail.com<br />
              Senha: 573039
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          <Button 
            onClick={fixMasterAdmin}
            disabled={isLoading}
            className="w-full"
            variant={result ? "outline" : "default"}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                {result ? 'Verificar Novamente' : 'Corrigir Usuario Master'}
              </>
            )}
          </Button>
          
          <Button 
            onClick={loginDirectly}
            disabled={isLoading}
            className="w-full"
            variant="secondary"
          >
            {isLoading ? (
              <>Processando...</>
            ) : (
              <>Login Direto como Admin</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MasterAdminFixer;
