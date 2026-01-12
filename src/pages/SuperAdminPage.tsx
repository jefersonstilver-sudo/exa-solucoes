
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ModernSuperAdminLayout from '@/components/admin/layout/ModernSuperAdminLayout';
import SuperAdminRoutes from '@/routes/SuperAdminRoutes';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import UnifiedLogo from '@/components/layout/UnifiedLogo';

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
      console.log('❌ NÃO LOGADO: Redirecionando para login ERP');
      toast.error('Você precisa estar logado para acessar esta área.');
      navigate('/sistema/login', { replace: true });
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
      
      const currentRole = userProfile?.role;
      
      // Se é um admin (mas não super_admin), redirecionar para /admin com mensagem específica
      if (currentRole === 'admin_financeiro' || currentRole === 'admin_marketing' || currentRole === 'admin') {
        toast.error('Você não tem permissão para acessar esta área. Redirecionando para seu painel...', {
          duration: 3000
        });
        navigate('/admin', { replace: true });
      } else {
        // Para usuários não-admin, redirecionar para login ERP
        toast.error('Acesso negado. Área restrita ao Super Administrador.', {
          duration: 5000,
          action: {
            label: 'Fazer Login',
            onClick: () => navigate('/sistema/login')
          }
        });
        navigate('/sistema/login', { replace: true });
      }
      
      setHasChecked(true);
      return;
    }

    console.log('✅ ACESSO AUTORIZADO: Super admin confirmado');
    toast.success('Bem-vindo ao Painel Administrativo!', {
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
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center">
        {/* Logo EXA animada */}
        <div className="text-center">
          <img 
            src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0" 
            alt="EXA Mídia" 
            className="w-16 h-16 mx-auto mb-8 animate-pulse"
          />
          
          {/* Loader circular elegante estilo Nubank */}
          <div className="relative w-10 h-10 mx-auto mb-6">
            <div className="absolute inset-0 border-2 border-gray-200 rounded-full" />
            <div className="absolute inset-0 border-2 border-[#9C1E1E] border-t-transparent rounded-full animate-spin" />
          </div>
          
          <p className="text-gray-600 text-sm font-medium">Carregando...</p>
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
            onClick={() => navigate('/sistema/login', { replace: true })}
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
