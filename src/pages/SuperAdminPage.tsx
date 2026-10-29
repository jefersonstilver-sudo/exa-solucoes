
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ModernSuperAdminLayout from '@/components/admin/layout/ModernSuperAdminLayout';
import SuperAdminRoutes from '@/routes/SuperAdminRoutes';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { TelaCarregando } from '@/components/loading/MarcaCarregando';

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, isLoading, isLoggedIn, isSuperAdmin } = useAuth();
  const [accessGranted, setAccessGranted] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [aguardouSessao, setAguardouSessao] = useState(false);
  const [semSessao, setSemSessao] = useState(false);

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
      // O perfil pode chegar alguns instantes depois da sessão: se há sessão salva, espera em vez de mandar para o login
      if (!aguardouSessao) {
        setAguardouSessao(true);
        supabase.auth.getSession().then(({ data }) => {
          if (!data.session) setSemSessao(true);
          else setTimeout(() => setSemSessao(true), 4000); // sessão existe mas o perfil não veio em 4 s
        });
        return;
      }
      if (!semSessao) return;
      console.log('❌ NÃO LOGADO: Redirecionando para login ERP');
      toast.error('Você precisa estar logado para acessar esta área.');
      // volta para a mesma página depois do login (links diretos: painel, Nando, alertas)
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
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
            onClick: () => navigate('/login')
          }
        });
        navigate('/login', { replace: true });
      }
      
      setHasChecked(true);
      return;
    }

    console.log('✅ ACESSO AUTORIZADO: Super admin confirmado');
    
    setAccessGranted(true);
    setHasChecked(true);
  }, [userProfile, isLoading, isLoggedIn, isSuperAdmin, navigate, hasChecked, location.pathname, aguardouSessao, semSessao]);

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
    return <TelaCarregando tema="claro" />;
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
