
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useUserSession } from '@/hooks/useUserSession';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const MyVideos = () => {
  const { isLoggedIn, isLoading } = useUserSession();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      toast.error('Você precisa estar logado para acessar a área do anunciante');
      navigate('/login?redirect=/anunciante/videos');
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
        <h1 className="text-3xl font-bold mb-6">Meus Vídeos</h1>
        
        <div className="p-8 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center">
          <p className="text-muted-foreground">
            Página em desenvolvimento. Em breve você poderá gerenciar seus vídeos aqui.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default MyVideos;
