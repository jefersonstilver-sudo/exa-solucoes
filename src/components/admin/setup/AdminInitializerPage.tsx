
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import AdminInitializer from '@/components/admin/setup/AdminInitializer';
import { useUserSession } from '@/hooks/useUserSession';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import UserSyncComponent from './UserSyncComponent';
import NavigationButtons from './NavigationButtons';

const AdminInitializerPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useUserSession();
  const { isLoading } = useRouteProtection({
    requireLogin: true,
    redirectTo: '/login'
  });
  
  useEffect(() => {
    // Check if user is logged in and has admin permissions
    if (!isLoading && !isLoggedIn) {
      toast.error("Você precisa estar logado para acessar esta página.");
      navigate('/login');
    }
  }, [isLoggedIn, navigate, isLoading]);
  
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Configuração do Administrador</h1>
        <p className="text-gray-500 text-center">
          Configure o administrador master e sincronize usuários
        </p>
      </div>
      
      <div className="space-y-8">
        {/* Admin Initializer Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Inicializar Admin Master</h2>
          <AdminInitializer />
        </section>
        
        {/* User Sync Section - Now extracted to a component */}
        <UserSyncComponent />
        
        {/* Navigation - Now extracted to a component */}
        <NavigationButtons />
      </div>
    </div>
  );
};

export default AdminInitializerPage;
