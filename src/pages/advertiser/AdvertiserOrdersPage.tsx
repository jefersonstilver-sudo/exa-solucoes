
import React from 'react';
import Layout from '@/components/layout/Layout';
import AdvertiserOrders from './AdvertiserOrders';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const AdvertiserOrdersPage = () => {
  const { isLoggedIn, isLoading } = useAuth();

  console.log('🔍 AdvertiserOrdersPage: Auth state:', { isLoggedIn, isLoading });

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indexa-purple mx-auto mb-4"></div>
            <p>Verificando acesso...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirecionar para login se não estiver logado
  if (!isLoggedIn) {
    console.log('❌ AdvertiserOrdersPage: Usuário não logado, redirecionando para login');
    return <Navigate to="/login?redirect=/meus-pedidos" replace />;
  }

  // Renderizar página com layout
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <AdvertiserOrders />
      </div>
    </Layout>
  );
};

export default AdvertiserOrdersPage;
