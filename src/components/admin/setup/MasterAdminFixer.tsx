
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import AdminDiagnostics from './AdminDiagnostics';
import AdminFixerStatus from './AdminFixerStatus';
import AdminFixerActions from './AdminFixerActions';
import EmergencyAdminAccess from './EmergencyAdminAccess';
import EmergencyPasswordReset from './EmergencyPasswordReset';
import UserMetadataSync from './UserMetadataSync';

const MasterAdminFixer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [localAuthCheck, setLocalAuthCheck] = useState<string | null>(null);
  
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
  
  const recreateMasterAdmin = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Iniciando recriação completa do admin master...');
      
      const { data, error: invokeError } = await supabase.functions.invoke('recreate-master-admin');
      
      if (invokeError) {
        console.error('Erro ao invocar função:', invokeError);
        throw invokeError;
      }
      
      console.log('Resposta da recriação:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido na recriação');
      }
      
      setResult(data);
      toast.success('Usuário admin master recriado com sucesso!');
      
      // Try to clear local session after successful recreation
      try {
        await supabase.auth.signOut();
        console.log('Sessão local limpa para garantir login limpo');
        toast.info('Sessão limpa. Agora você pode fazer login com as credenciais corretas.');
      } catch (err) {
        console.error('Erro ao limpar sessão:', err);
      }
    } catch (err: any) {
      console.error('Erro ao recriar admin master:', err);
      setError(err.message);
      toast.error(`Erro ao recriar admin master: ${err.message}`);
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
    <div className="space-y-6">
      <AdminDiagnostics localAuthCheck={localAuthCheck} />
      
      <Card className="max-w-md mx-auto">
        <CardContent className="space-y-4 pt-6">
          <AdminFixerStatus result={result} error={error} />
          <div className="space-y-2">
            <button 
              onClick={recreateMasterAdmin}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isLoading ? 'Recriando...' : 'Recriar Usuário Master (DEFINITIVO)'}
            </button>
            
            <button 
              onClick={loginDirectly}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isLoading ? 'Processando...' : 'Testar Login Direto'}
            </button>
          </div>
        </CardContent>
      </Card>

      <UserMetadataSync />
      <EmergencyPasswordReset />
      <EmergencyAdminAccess />
    </div>
  );
};

export default MasterAdminFixer;
