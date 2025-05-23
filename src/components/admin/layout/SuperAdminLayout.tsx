
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import { toast } from 'sonner';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const { userProfile, isLoading } = useAuth();
  const navigate = useNavigate();
  
  console.log('SuperAdminLayout - Verificando acesso:', {
    userEmail: userProfile?.email,
    userRole: userProfile?.role,
    isLoading
  });
  
  // Proteção específica para Super Admin
  const { isAuthorized } = useRouteProtection({
    redirectTo: '/login',
    message: 'Acesso restrito ao Super Administrador',
    requireLogin: true,
    requiredRole: 'super_admin'
  });

  // Verificação rigorosa: APENAS jefersonstilver@gmail.com
  React.useEffect(() => {
    if (!isLoading && userProfile) {
      console.log('SuperAdminLayout - Verificação rigorosa:', {
        email: userProfile.email,
        role: userProfile.role,
        isExpectedSuperAdmin: userProfile.email === 'jefersonstilver@gmail.com'
      });
      
      if (userProfile.email !== 'jefersonstilver@gmail.com' || userProfile.role !== 'super_admin') {
        console.log('SuperAdminLayout - ACESSO NEGADO');
        toast.error('Acesso negado. Área restrita ao Super Administrador.');
        navigate('/login');
      } else {
        console.log('SuperAdminLayout - ACESSO AUTORIZADO');
      }
    }
  }, [userProfile, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthorized || userProfile?.email !== 'jefersonstilver@gmail.com') {
    console.log('SuperAdminLayout - Não autorizado, retornando null');
    return null;
  }

  console.log('SuperAdminLayout - Renderizando layout do super admin');
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
