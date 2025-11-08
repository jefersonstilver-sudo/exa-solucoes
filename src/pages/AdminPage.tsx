
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import ModernAdminLayout from '@/components/admin/layout/ModernAdminLayout';
import AdminRoutes from '@/routes/AdminRoutes';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const AdminPage = () => {
  const { userProfile, isLoading, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    const isAdminRole = ['admin', 'admin_marketing', 'admin_financeiro'].includes(userProfile?.role || '');
    const isSuperAdmin = userProfile?.role === 'super_admin';

    console.log('🛡️ AdminPage Protection:', {
      userEmail: userProfile?.email,
      userRole: userProfile?.role,
      isAdminRole,
      isSuperAdmin,
      isLoggedIn,
      currentPath: location.pathname,
      emailConfirmed: userProfile?.email_verified_at
    });

    // FASE 5: BLOQUEAR SE EMAIL NÃO CONFIRMADO
    if (isLoggedIn && userProfile && !userProfile.email_verified_at) {
      console.log('🚫 AdminPage: Email não confirmado, bloqueando acesso');
      toast.error('Email não confirmado', {
        description: 'Você precisa confirmar seu email antes de acessar o sistema. Verifique sua caixa de entrada.',
        duration: 8000
      });
      navigate('/login', { replace: true });
      return;
    }

    if (!isLoggedIn || (!isAdminRole && !isSuperAdmin)) {
      console.log('🚫 AdminPage: Acesso negado');
      toast.error('Acesso restrito a administradores');
      navigate('/login?redirect=/admin', { replace: true });
      return;
    }

    // Safety redirect: se super_admin tentar acessar /admin, redirecionar para /super_admin
    if (isSuperAdmin && location.pathname.startsWith('/admin')) {
      console.log('🔄 Redirecionando super_admin para /super_admin');
      navigate('/super_admin', { replace: true });
      return;
    }

  }, [userProfile, isLoading, isLoggedIn, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  const isAdminRole = ['admin', 'admin_marketing', 'admin_financeiro'].includes(userProfile?.role || '');
  const isSuperAdmin = userProfile?.role === 'super_admin';

  if (!isLoggedIn || (!isAdminRole && !isSuperAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa de permissões de administrador para acessar esta área.</p>
        </div>
      </div>
    );
  }

  return (
    <ModernAdminLayout>
      <AdminRoutes />
    </ModernAdminLayout>
  );
};

export default AdminPage;
