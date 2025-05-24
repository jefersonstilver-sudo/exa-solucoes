
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { useSuperAdminProtection } from '@/hooks/useSuperAdminProtection';
import SuperAdminLayout from '@/components/admin/layout/SuperAdminLayout';
import SuperAdminRoutes from '@/routes/SuperAdminRoutes';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const { user, isLoading, isLoggedIn } = useUserSession();
  const { isSuperAdmin } = useSuperAdminProtection();

  // VERIFICAÇÃO CRÍTICA DE SEGURANÇA
  useEffect(() => {
    if (!isLoading) {
      console.log('🔍 SuperAdminPage - Verificação de acesso crítica:', {
        userEmail: user?.email,
        userRole: user?.role,
        isLoggedIn,
        isSuperAdmin,
        expectedEmail: 'jefersonstilver@gmail.com'
      });

      // BLOQUEIO ABSOLUTO: Se não é super admin, negar acesso
      if (!isLoggedIn || !isSuperAdmin || user?.email !== 'jefersonstilver@gmail.com') {
        console.log('🚫 ACESSO NEGADO - SuperAdminPage');
        toast.error('Acesso negado. Área restrita ao Super Administrador.', {
          duration: 4000
        });
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1000);
      } else {
        console.log('✅ ACESSO AUTORIZADO - SuperAdminPage para:', user.email);
      }
    }
  }, [user, isLoading, isLoggedIn, isSuperAdmin, navigate]);

  // Tela de carregamento com indicador de segurança
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
            <Shield className="absolute inset-0 m-auto h-6 w-6 text-amber-400" />
          </div>
          <p className="text-slate-300 font-medium">Verificando credenciais de super administrador...</p>
        </div>
      </div>
    );
  }

  // Tela de acesso negado
  if (!isLoggedIn || !isSuperAdmin || user?.email !== 'jefersonstilver@gmail.com') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 to-slate-900">
        <div className="flex flex-col items-center space-y-4 text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-400" />
          <h1 className="text-2xl font-bold text-red-400">Acesso Negado</h1>
          <p className="text-slate-300">
            Esta área é restrita exclusivamente ao Super Administrador.
          </p>
          <p className="text-slate-400 text-sm">
            Redirecionando para a página de login...
          </p>
        </div>
      </div>
    );
  }

  // Renderização autorizada do painel super admin
  console.log('🎯 RENDERIZANDO SuperAdminPage para usuário autorizado:', user.email);
  
  return (
    <SuperAdminLayout>
      <SuperAdminRoutes />
    </SuperAdminLayout>
  );
};

export default SuperAdminPage;
