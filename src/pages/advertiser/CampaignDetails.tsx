
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const CampaignDetails = () => {
  const { id } = useParams();
  const { isAuthorized, isLoading } = useRouteProtection({
    requireLogin: true,
    requiredRole: 'client',
    redirectTo: '/login',
    message: 'Você precisa estar logado para acessar a área do anunciante'
  });
  
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
  
  if (!isAuthorized) {
    return null; // The hook will handle redirection
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Detalhes da Campanha</h1>
        
        <div className="p-8 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center">
          <p className="text-muted-foreground">
            Página em desenvolvimento. Em breve você poderá ver os detalhes da campanha {id} aqui.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default CampaignDetails;
