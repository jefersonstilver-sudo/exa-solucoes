
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const { isLoading, isLoggedIn, user } = useUserSession();
  
  // Check if user is logged in and has admin role
  React.useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      toast.error('Você precisa estar logado para acessar esta página');
      navigate('/login?redirect=/admin');
      return;
    }
    
    // Check user role when it's available
    if (!isLoading && isLoggedIn && user?.user_metadata) {
      const role = user.user_metadata.role;
      
      // If super admin is required, check for that role specifically
      if (requireSuperAdmin && role !== 'super_admin') {
        toast.error('Você não tem permissão para acessar esta página');
        navigate('/forbidden');
        return;
      }
      
      // Check if user has any admin role
      if (!role || (role !== 'admin' && role !== 'super_admin')) {
        toast.error('Você não tem permissão para acessar esta página');
        navigate('/forbidden');
        return;
      }
    }
  }, [isLoading, isLoggedIn, user, navigate, requireSuperAdmin]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
        <p className="ml-2 text-lg">Carregando...</p>
      </div>
    );
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
