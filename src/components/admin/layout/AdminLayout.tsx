
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouteProtection } from '@/hooks/useRouteProtection';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  requireSuperAdmin?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title = 'Admin Panel',
  requireSuperAdmin = false
}) => {
  const navigate = useNavigate();
  const { isLoggedIn, hasRole, isLoading } = useUserSession();
  
  // Use our route protection hook for consistent permission checking
  const requiredRole = requireSuperAdmin ? 'super_admin' : 'admin';
  const { isAuthorized } = useRouteProtection({
    requireLogin: true,
    requiredRole,
    redirectTo: '/login',
    message: requireSuperAdmin
      ? 'Você precisa ser um super administrador para acessar esta página'
      : 'Você precisa ser um administrador para acessar esta página'
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
        <p className="ml-2 text-lg">Carregando...</p>
      </div>
    );
  }
  
  if (!isAuthorized && !isLoading) {
    return null; // useRouteProtection will handle redirects
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader title={title} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
        <footer className="py-4 px-6 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
          <div className="container mx-auto">
            &copy; {new Date().getFullYear()} INDEXA Admin Panel
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
