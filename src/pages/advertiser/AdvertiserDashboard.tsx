
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { useUserSession } from '@/hooks/useUserSession';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

const AdvertiserDashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useUserSession();
  
  // BLOQUEIO RIGOROSO: Super admin NÃO deve acessar área do anunciante
  useEffect(() => {
    if (!isLoading && user) {
      console.log('🔍 AdvertiserDashboard - Verificando acesso:', {
        email: user.email,
        role: user.role
      });
      
      // VERIFICAÇÃO CRÍTICA: Se é super admin, BLOQUEAR acesso
      if (user.email === 'jefersonstilver@gmail.com' || user.role === 'super_admin') {
        console.log('🚫 BLOQUEIO: Super admin tentando acessar área do anunciante');
        toast.error('Super administrador deve usar o painel administrativo');
        navigate('/super_admin');
        return;
      }
    }
  }, [user, isLoading, navigate]);
  
  const { isAuthorized, isLoading: routeLoading } = useRouteProtection({
    requireLogin: true,
    requiredRole: 'client',
    redirectTo: '/login',
    message: 'Você precisa estar logado para acessar a área do anunciante'
  });
  
  if (isLoading || routeLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
          <p className="ml-2 text-lg">Carregando...</p>
        </div>
      </Layout>
    );
  }
  
  // Verificação adicional de segurança
  if (user?.email === 'jefersonstilver@gmail.com' || user?.role === 'super_admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] flex-col">
          <Shield className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-red-500 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Super administrador deve usar o painel administrativo</p>
        </div>
      </Layout>
    );
  }
  
  if (!isAuthorized) {
    return null; // The hook will handle redirection
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Área do Anunciante</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-3">Minhas Campanhas</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Visualize e gerencie suas campanhas de anúncios.
              </p>
            </div>
            <a 
              href="/anunciante/campanhas"
              className="bg-indexa-purple text-white py-2 px-4 rounded-md hover:bg-indexa-purple-dark transition-colors text-center"
            >
              Ver Campanhas
            </a>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-3">Meus Vídeos</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Gerencie os vídeos que serão exibidos em suas campanhas.
              </p>
            </div>
            <a 
              href="/anunciante/videos"
              className="bg-indexa-purple text-white py-2 px-4 rounded-md hover:bg-indexa-purple-dark transition-colors text-center"
            >
              Ver Vídeos
            </a>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-3">Meus Pedidos</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Visualize o histórico de pedidos e pagamentos.
              </p>
            </div>
            <a 
              href="/meus-pedidos"
              className="bg-indexa-purple text-white py-2 px-4 rounded-md hover:bg-indexa-purple-dark transition-colors text-center"
            >
              Ver Pedidos
            </a>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Resumo da Conta</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Esta página está em desenvolvimento. Em breve você terá acesso a estatísticas e informações sobre suas campanhas.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AdvertiserDashboard;
