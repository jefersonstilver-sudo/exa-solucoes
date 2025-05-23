
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import AdminAccessButton from '@/components/admin/AdminAccessButton';
import MasterAdminFixer from '@/components/admin/setup/MasterAdminFixer';
import { motion } from 'framer-motion';
import { useUserSession } from '@/hooks/useUserSession';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, hasRole, user } = useUserSession();
  const isAdmin = hasRole('admin');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Admin Access Section - Show at top for admins or debugging */}
        {(isLoggedIn && isAdmin) && (
          <div className="mb-8 flex justify-center">
            <AdminAccessButton />
          </div>
        )}
        
        {/* Master Admin Debugging Tool - Always visible for troubleshooting */}
        <div className="mb-8">
          <details className="max-w-md mx-auto">
            <summary className="text-sm text-gray-500 cursor-pointer text-center mb-4">
              🔧 Ferramentas de Administração (Debug)
            </summary>
            <MasterAdminFixer />
          </details>
        </div>

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
          
          {/* Login/Admin access for non-logged users */}
          {!isLoggedIn && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="text-sm"
                >
                  Fazer Login
                </Button>
                <AdminAccessButton variant="subtle" />
              </div>
            </div>
          )}
          
          {/* User status display for debugging */}
          {user && (
            <div className="mt-4 text-xs text-gray-500">
              Logado como: {user.email} ({user.role})
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Home;
