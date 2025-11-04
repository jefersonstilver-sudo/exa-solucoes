
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ModernSuperAdminLayout from '@/components/admin/layout/ModernSuperAdminLayout';
import SuperAdminRoutes from '@/routes/SuperAdminRoutes';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, isLoading, isLoggedIn, isSuperAdmin } = useAuth();
  const [accessGranted, setAccessGranted] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    console.log('🔄 SUPER ADMIN PAGE - Estado atual:', {
      isLoading,
      isLoggedIn,
      hasChecked,
      isSuperAdmin,
      userEmail: userProfile?.email,
      userRole: userProfile?.role,
      currentPath: location.pathname
    });

    if (isLoading) {
      console.log('⏳ AGUARDANDO: Auth ainda está carregando...');
      return;
    }

    if (hasChecked) {
      console.log('✅ JÁ VERIFICADO: Evitando re-verificação');
      return;
    }

    console.log('🔍 INICIANDO VERIFICAÇÃO: Auth carregado, fazendo verificação de acesso');

    if (!isLoggedIn) {
      console.log('❌ NÃO LOGADO: Redirecionando para login');
      toast.error('Você precisa estar logado para acessar esta área.');
      navigate('/login?redirect=/super_admin', { replace: true });
      setHasChecked(true);
      return;
    }

    console.log('🔍 VERIFICAÇÃO SUPER ADMIN:', {
      email: userProfile?.email,
      role: userProfile?.role,
      isSuperAdmin,
      emailMatch: userProfile?.role === 'super_admin',
      roleMatch: userProfile?.role === 'super_admin'
    });

    if (!isSuperAdmin) {
      console.log('🚫 ACESSO NEGADO: Não é super admin');
      toast.error('Acesso negado. Área restrita ao Super Administrador.', {
        duration: 5000
      });
      
      navigate('/login', { replace: true });
      setHasChecked(true);
      return;
    }

    console.log('✅ ACESSO AUTORIZADO: Super admin confirmado');
    toast.success('Bem-vindo ao Painel Administrativo INDEXA!', {
      duration: 3000
    });
    
    setAccessGranted(true);
    setHasChecked(true);
  }, [userProfile, isLoading, isLoggedIn, isSuperAdmin, navigate, hasChecked, location.pathname]);

  useEffect(() => {
    const securityTimeout = setTimeout(() => {
      if (isLoading && !hasChecked) {
        console.log('⚠️ TIMEOUT DE SEGURANÇA: Forçando verificação após 3s');
        toast.warning('Verificação de acesso demorou muito. Tentando novamente...');
        setHasChecked(false);
      }
    }, 3000);

    return () => clearTimeout(securityTimeout);
  }, [isLoading, hasChecked]);

  if (isLoading || !hasChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indexa-purple to-purple-800">
        <div className="flex flex-col items-center space-y-6 p-8 bg-white rounded-xl shadow-2xl">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">INDEXA</h2>
            <p className="text-gray-600">Carregando painel administrativo...</p>
            <div className="flex items-center justify-center space-x-2 mt-3">
              <Shield className="h-4 w-4 text-indexa-purple" />
              <span className="text-sm text-indexa-purple font-medium">Sistema Seguro</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Verificando credenciais de Super Admin...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="flex flex-col items-center space-y-6 text-center max-w-lg p-8 bg-white rounded-xl shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900">Acesso Negado</h1>
            <p className="text-gray-600 text-lg">
              Esta área é exclusiva do Super Administrador do sistema INDEXA.
            </p>
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg mt-4">
              <p><strong>Role necessária:</strong> super_admin</p>
              <p className="mt-2 text-xs">Apenas usuários com role de super_admin no banco de dados podem acessar esta área.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-6 py-3 bg-indexa-purple text-white rounded-lg hover:bg-indexa-purple/90 transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  console.log('🎉 RENDERIZANDO: Painel administrativo autorizado');
  return (
    <ModernSuperAdminLayout>
      <SuperAdminRoutes />
    </ModernSuperAdminLayout>
  );
};

export default SuperAdminPage;
