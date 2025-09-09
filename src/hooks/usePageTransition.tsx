import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface UsePageTransitionProps {
  minLoadingTime?: number;
  transitionDelay?: number;
}

export const usePageTransition = ({ 
  minLoadingTime = 500,
  transitionDelay = 100 
}: UsePageTransitionProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Carregando...');
  const location = useLocation();

  useEffect(() => {
    const handleRouteChange = async () => {
      // Determinar mensagem baseada na rota
      const routeMessages: Record<string, string> = {
        '/loja': 'Carregando loja...',
        '/checkout': 'Preparando checkout...',
        '/checkout/cupom': 'Verificando cupons...',
        '/checkout/resumo': 'Carregando resumo...',
        '/checkout/finalizar': 'Finalizando pedido...',
        '/payment': 'Processando pagamento...',
        '/pix-payment': 'Gerando PIX...',
        '/paineis-digitais': 'Carregando painéis...',
        '/sou-sindico': 'Carregando informações...',
        '/admin': 'Carregando painel admin...',
      };

      const currentPath = location.pathname;
      const message = Object.keys(routeMessages).find(route => 
        currentPath.startsWith(route)
      );
      
      setLoadingMessage(message ? routeMessages[message] : 'Carregando página...');
      setIsLoading(true);

      // Simular tempo mínimo de carregamento para UX suave
      const startTime = Date.now();
      
      // Aguardar transição + tempo mínimo
      await new Promise(resolve => {
        setTimeout(() => {
          const elapsed = Date.now() - startTime;
          const remainingTime = Math.max(0, minLoadingTime - elapsed);
          setTimeout(resolve, remainingTime);
        }, transitionDelay);
      });

      setIsLoading(false);
    };

    handleRouteChange();
  }, [location.pathname, minLoadingTime, transitionDelay]);

  return {
    isLoading,
    loadingMessage,
    setIsLoading,
    setLoadingMessage
  };
};