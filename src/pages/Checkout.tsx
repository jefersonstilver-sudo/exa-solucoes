
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useUserSession } from '@/hooks/useUserSession';
import { useNavigate } from 'react-router-dom';
import { ClientOnly } from '@/components/ui/client-only';
import CheckoutContainer from '@/components/checkout/CheckoutContainer';

export default function Checkout() {
  const { isLoggedIn, isLoading: isSessionLoading } = useUserSession();
  const navigate = useNavigate();
  
  // Verificação de autenticação - redireciona para login se necessário
  useEffect(() => {
    if (!isSessionLoading && !isLoggedIn) {
      navigate('/login?redirect=/checkout');
    }
  }, [isLoggedIn, isSessionLoading, navigate]);
  
  // Tela de carregamento enquanto verifica a sessão
  if (isSessionLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <ClientOnly>
        <CheckoutContainer />
      </ClientOnly>
    </Layout>
  );
}
