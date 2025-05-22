
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useUserSession } from '@/hooks/useUserSession';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AdvertiserDashboard = () => {
  const { isLoggedIn, isLoading } = useUserSession();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      toast.error('Você precisa estar logado para acessar a área do anunciante');
      navigate('/login?redirect=/anunciante');
    }
  }, [isLoading, isLoggedIn, navigate]);
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
          <p className="ml-2 text-lg">Carregando...</p>
        </div>
      </Layout>
    );
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
            <button 
              onClick={() => navigate('/anunciante/campanhas')}
              className="bg-indexa-purple text-white py-2 px-4 rounded-md hover:bg-indexa-purple-dark transition-colors"
            >
              Ver Campanhas
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-3">Meus Vídeos</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Gerencie os vídeos que serão exibidos em suas campanhas.
              </p>
            </div>
            <button 
              onClick={() => navigate('/anunciante/videos')}
              className="bg-indexa-purple text-white py-2 px-4 rounded-md hover:bg-indexa-purple-dark transition-colors"
            >
              Ver Vídeos
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-3">Meus Pedidos</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Visualize o histórico de pedidos e pagamentos.
              </p>
            </div>
            <button 
              onClick={() => navigate('/meus-pedidos')}
              className="bg-indexa-purple text-white py-2 px-4 rounded-md hover:bg-indexa-purple-dark transition-colors"
            >
              Ver Pedidos
            </button>
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
