
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import AdminAccessButton from '@/components/admin/AdminAccessButton';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userProfile, hasRole } = useAuth();
  
  // PHOENIX: Verificação super admin baseada APENAS em JWT claims
  const isSuperAdmin = userProfile?.email === 'jefersonstilver@gmail.com' && userProfile?.role === 'super_admin';
  const isRegularAdmin = hasRole('admin') && !isSuperAdmin;

  console.log('🔧 PHOENIX Home - Estado baseado em JWT:', {
    userEmail: userProfile?.email,
    userRole: userProfile?.role,
    isSuperAdmin,
    isRegularAdmin,
    isLoggedIn
  });

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
          {isLoggedIn && (isSuperAdmin || isRegularAdmin) && (
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
