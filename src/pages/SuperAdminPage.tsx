
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ModernSuperAdminLayout from '@/components/admin/layout/ModernSuperAdminLayout';
import SuperAdminRoutes from '@/routes/SuperAdminRoutes';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, isLoading, isLoggedIn } = useAuth();
  const [accessGranted, setAccessGranted] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (isLoading || hasChecked) {
      return;
    }

    if (!isLoggedIn) {
      toast.error('Você precisa estar logado para acessar esta área.');
      navigate('/login?redirect=/super_admin', { replace: true });
      setHasChecked(true);
      return;
    }

    const isSuperAdmin = userProfile?.email === 'jefersonstilver@gmail.com' && 
                        userProfile?.role === 'super_admin';

    if (!isSuperAdmin) {
      toast.error('Acesso negado. Área restrita ao Super Administrador.', {
        duration: 5000
      });
      
      navigate('/login', { replace: true });
      setHasChecked(true);
      return;
    }

    toast.success('Bem-vindo ao Painel Administrativo INDEXA!', {
      duration: 3000
    });
    
    setAccessGranted(true);
    setHasChecked(true);
  }, [userProfile, isLoading, isLoggedIn, navigate, hasChecked]);

  if (isLoading || !hasChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">INDEXA</h2>
            <p className="text-muted-foreground">Carregando painel...</p>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs text-primary">Sistema Seguro</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-6 text-center max-w-lg p-8">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Esta área é exclusiva do Super Administrador do sistema INDEXA.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ModernSuperAdminLayout>
      <SuperAdminRoutes />
    </ModernSuperAdminLayout>
  );
};

export default SuperAdminPage;
