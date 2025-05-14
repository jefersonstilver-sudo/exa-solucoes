
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useUserSession } from '@/hooks/useUserSession';
import { useNavigate } from 'react-router-dom';
import { ClientOnly } from '@/components/ui/client-only';
import CheckoutContainer from '@/components/checkout/CheckoutContainer';
import { useToast } from '@/hooks/use-toast';

export default function Checkout() {
  const { isLoggedIn, isLoading: isSessionLoading } = useUserSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Verificação de autenticação - redireciona para login se necessário
  useEffect(() => {
    console.log("Checkout: Verificando autenticação, isLoggedIn:", isLoggedIn, "isSessionLoading:", isSessionLoading);
    if (!isSessionLoading && !isLoggedIn) {
      toast({
        title: "Login necessário",
        description: "Faça login para continuar com a compra",
        variant: "destructive"
      });
      navigate('/login?redirect=/selecionar-plano');
    }
  }, [isLoggedIn, isSessionLoading, navigate, toast]);
  
  // Verificar se o carrinho existe no localStorage
  useEffect(() => {
    try {
      console.log("Checkout: Verificando carrinho no localStorage");
      const savedCart = localStorage.getItem('panelCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log("Checkout: Carrinho carregado do localStorage:", parsedCart.length, "itens");
        
        if (parsedCart.length === 0) {
          console.log("Checkout: Carrinho vazio, redirecionando para loja");
          toast({
            title: "Carrinho vazio",
            description: "Adicione itens ao carrinho antes de finalizar a compra.",
            variant: "destructive"
          });
          navigate('/paineis-digitais/loja');
        }
      } else {
        // Se não houver carrinho no localStorage
        console.log("Checkout: Carrinho não encontrado no localStorage");
        toast({
          title: "Carrinho vazio",
          description: "Adicione itens ao carrinho antes de finalizar a compra.",
          variant: "destructive"
        });
        navigate('/paineis-digitais/loja');
      }
    } catch (e) {
      console.error("Erro ao carregar carrinho:", e);
      toast({
        title: "Erro ao carregar carrinho",
        description: "Ocorreu um erro ao carregar seu carrinho. Tente novamente.",
        variant: "destructive"
      });
      navigate('/paineis-digitais/loja');
    }
  }, [navigate, toast]);
  
  // Verificar se o plano foi selecionado
  useEffect(() => {
    try {
      console.log("Checkout: Verificando plano selecionado no localStorage");
      const selectedPlan = localStorage.getItem('selectedPlan');
      console.log("Checkout: Plano carregado:", selectedPlan);
      if (!selectedPlan) {
        console.log("Checkout: Plano não selecionado, redirecionando para seleção de plano");
        toast({
          title: "Selecione um plano",
          description: "Escolha um plano antes de prosseguir com o checkout.",
          variant: "destructive"
        });
        navigate('/selecionar-plano');
      }
    } catch (e) {
      console.error("Erro ao verificar plano selecionado:", e);
    }
  }, [navigate, toast]);
  
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
