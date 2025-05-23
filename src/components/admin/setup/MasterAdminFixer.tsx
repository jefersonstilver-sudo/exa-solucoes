
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
    <div className="space-y-6">
      <AdminDiagnostics localAuthCheck={localAuthCheck} />
      
      <Card className="max-w-md mx-auto">
        <CardContent className="space-y-4 pt-6">
          <AdminFixerStatus result={result} error={error} />
          <AdminFixerActions 
            onFixMasterAdmin={fixMasterAdmin}
            onLoginDirectly={loginDirectly}
            isLoading={isLoading}
            result={result}
          />
        </CardContent>
      </Card>

      <UserMetadataSync />
      <EmergencyPasswordReset />
      <EmergencyAdminAccess />
    </div>
  );
};

export default MasterAdminFixer;
