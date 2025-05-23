
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import { toast } from 'sonner';
import { Shield, Lock } from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
            <Shield className="absolute inset-0 m-auto h-6 w-6 text-amber-400" />
          </div>
          <p className="text-slate-300 font-medium">Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized || userProfile?.email !== 'jefersonstilver@gmail.com') {
    console.log('SuperAdminLayout - Não autorizado, retornando null');
    return null;
  }

  console.log('SuperAdminLayout - Renderizando layout do super admin');
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Subtle security indicator */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 z-50 opacity-80"></div>
      
      {/* Enhanced sidebar with dark theme */}
      <div className="relative">
        <AdminSidebar />
        {/* Subtle glow effect */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-500/30 to-transparent"></div>
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* Header with enhanced styling */}
        <div className="relative">
          <AdminHeader />
          {/* Security badge */}
          <div className="absolute top-2 right-4 flex items-center space-x-1 text-xs text-amber-400 bg-slate-800/50 px-2 py-1 rounded-full backdrop-blur-sm">
            <Lock className="h-3 w-3" />
            <span className="font-medium">MASTER</span>
          </div>
        </div>
        
        {/* Main content with enhanced container */}
        <main className="flex-1 p-6 relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(255,255,255)_1px,_transparent_0)] bg-[length:20px_20px]"></div>
          </div>
          
          {/* Content container with glass effect */}
          <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-transparent rounded-xl"></div>
            <div className="relative">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
