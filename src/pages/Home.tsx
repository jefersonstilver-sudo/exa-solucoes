
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import AdminAccessButton from '@/components/admin/AdminAccessButton';
import { toast } from 'sonner';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userProfile, hasRole, isLoading } = useAuth();
  
  // PHOENIX: Verificação super admin baseada APENAS em JWT claims
  const isSuperAdmin = userProfile?.email === 'jefersonstilver@gmail.com' && userProfile?.role === 'super_admin';
  const isRegularAdmin = hasRole('admin') && !isSuperAdmin;

  // REDIRECIONAMENTO AUTOMÁTICO PARA SUPER ADMIN
  useEffect(() => {
    if (!isLoading && isLoggedIn && isSuperAdmin) {
      console.log('🚀 PHOENIX HOME: Super admin detectado - Redirecionamento automático para /super_admin');
      
      toast.success('Bem-vindo ao Painel Super Administrativo!', {
        duration: 3000
      });
      
      // Redirecionamento com delay mínimo para mostrar o toast
      setTimeout(() => {
        navigate('/super_admin', { replace: true });
      }, 1000);
    }
  }, [isLoading, isLoggedIn, isSuperAdmin, navigate]);

  console.log('🔧 PHOENIX Home - Estado baseado em JWT:', {
    userEmail: userProfile?.email,
    userRole: userProfile?.role,
    isSuperAdmin,
    isRegularAdmin,
    isLoggedIn,
    isLoading
  });

  // Mostrar loading enquanto está carregando ou durante redirecionamento
  if (isLoading || (isLoggedIn && isSuperAdmin)) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indexa-purple mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isSuperAdmin ? 'Redirecionando para painel administrativo...' : 'Carregando...'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Sua mídia digital em painéis de alto impacto
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Conectando marcas e audiências com tecnologia e performance
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => navigate('/client/comprar')}
              className="bg-indexa-purple hover:bg-indexa-purple/90 text-white px-8 py-2"
            >
              Começar agora
            </Button>
            <Button
              onClick={() => navigate('/planos')}
              variant="outline"
              className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple/10"
            >
              Ver planos
            </Button>
          </div>
          
          {/* Login access for non-logged users */}
          {!isLoggedIn && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="flex justify-center">
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="text-sm"
                >
                  Fazer Login
                </Button>
              </div>
            </div>
          )}
          
          {/* PHOENIX: AdminAccessButton unificado baseado em JWT */}
          {isLoggedIn && isRegularAdmin && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="flex justify-center">
                <AdminAccessButton />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Home;
