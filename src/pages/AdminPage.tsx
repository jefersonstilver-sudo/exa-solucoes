
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import AdminRoutes from '@/routes/AdminRoutes';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const AdminPage = () => {
  const { userProfile, isLoading, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'admin_marketing';
    const isSuperAdmin = userProfile?.role === 'super_admin' && userProfile?.email === 'jefersonstilver@gmail.com';

    console.log('🛡️ AdminPage Protection:', {
      userEmail: userProfile?.email,
      userRole: userProfile?.role,
      isAdmin,
      isSuperAdmin,
      isLoggedIn,
      currentPath: location.pathname
    });

    if (!isLoggedIn || (!isAdmin && !isSuperAdmin)) {
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

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'admin_marketing';
  const isSuperAdmin = userProfile?.role === 'super_admin' && userProfile?.email === 'jefersonstilver@gmail.com';

  if (!isLoggedIn || (!isAdmin && !isSuperAdmin)) {
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
    <AdminLayout>
      <AdminRoutes />
    </AdminLayout>
  );
};

export default AdminPage;
