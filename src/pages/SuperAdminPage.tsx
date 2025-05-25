
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import SuperAdminLayout from '@/components/admin/layout/SuperAdminLayout';
import SuperAdminRoutes from '@/routes/SuperAdminRoutes';
import { Loader2, Shield, AlertTriangle, Crown } from 'lucide-react';
import { toast } from 'sonner';

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, isLoading, isLoggedIn } = useAuth();
  const [accessGranted, setAccessGranted] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  console.log('🏛️ SuperAdminPage - CARREGANDO:', {
    currentPath: location.pathname,
    userEmail: userProfile?.email,
    userRole: userProfile?.role,
    isLoggedIn,
    isLoading,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    if (isLoading || hasChecked) {
      console.log('⏳ SuperAdminPage - Aguardando ou já verificado:', { isLoading, hasChecked });
      return;
    }

    console.log('🔍 SuperAdminPage - VERIFICAÇÃO FINAL:', {
      userEmail: userProfile?.email,
      userRole: userProfile?.role,
      isLoggedIn,
      isExpectedEmail: userProfile?.email === 'jefersonstilver@gmail.com',
      isExpectedRole: userProfile?.role === 'super_admin'
    });

    if (!isLoggedIn) {
      console.log('🚫 NÃO LOGADO - Redirecionando para login');
      toast.error('Você precisa estar logado para acessar esta área.');
      navigate('/login?redirect=/super_admin', { replace: true });
      setHasChecked(true);
      return;
    }

    // VERIFICAÇÃO ESPECÍFICA PARA SUPER ADMIN
    const isSuperAdmin = userProfile?.email === 'jefersonstilver@gmail.com' && 
                        userProfile?.role === 'super_admin';

    if (!isSuperAdmin) {
      console.log('🚫 NÃO É SUPER ADMIN - Acesso negado:', {
        email: userProfile?.email,
        role: userProfile?.role
      });
      
      toast.error('Acesso negado. Área restrita ao Super Administrador.', {
        duration: 5000
      });
      
      navigate('/login', { replace: true });
      setHasChecked(true);
      return;
    }

    console.log('✅ SUPER ADMIN VERIFICADO - Concedendo acesso');
    toast.success('Bem-vindo ao Painel Super Administrativo INDEXA!', {
      duration: 3000
    });
    
    setAccessGranted(true);
    setHasChecked(true);
  }, [userProfile, isLoading, isLoggedIn, navigate, hasChecked]);

  // Tela de carregamento
  if (isLoading || !hasChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indexa-purple-dark via-indexa-purple to-indexa-purple-dark">
        <div className="flex flex-col items-center space-y-6 max-w-md text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indexa-mint/30 border-t-indexa-mint"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Crown className="h-8 w-8 text-indexa-mint animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">INDEXA Master Control</h2>
            <p className="text-slate-300 font-medium">Carregando painel administrativo...</p>
            <div className="flex items-center justify-center space-x-2 mt-4">
              <Shield className="h-4 w-4 text-indexa-mint" />
              <span className="text-xs text-indexa-mint font-medium">SISTEMA SEGURO</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de acesso negado
  if (!accessGranted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-indexa-purple-dark to-indexa-purple-dark">
        <div className="flex flex-col items-center space-y-6 text-center max-w-lg p-8">
          <div className="relative">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/30">
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-red-400">Acesso Negado</h1>
            <h2 className="text-xl text-slate-300">Área Restrita</h2>
            <p className="text-slate-400 leading-relaxed">
              Esta área é exclusiva do Super Administrador do sistema INDEXA.
              Apenas credenciais autorizadas têm acesso a este painel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // RENDERIZAÇÃO AUTORIZADA - SEM VERIFICAÇÕES ADICIONAIS
  console.log('🎯 RENDERIZANDO SuperAdminPage - AUTORIZADO');
  
  return (
    <div className="min-h-screen">
      <SuperAdminLayout>
        <SuperAdminRoutes />
      </SuperAdminLayout>
    </div>
  );
};

export default SuperAdminPage;
