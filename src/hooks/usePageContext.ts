import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// Map routes to friendly descriptions for Sofia
const pageContextMap: Record<string, { section: string; description: string }> = {
  '/super_admin': { 
    section: 'Dashboard', 
    description: 'Dashboard principal do Super Admin com visão geral do sistema' 
  },
  '/super_admin/agentes': { 
    section: 'Agentes IA', 
    description: 'Gerenciamento de agentes de IA (Sofia, Eduardo, Alertas)' 
  },
  '/super_admin/paineis': { 
    section: 'Painéis', 
    description: 'Monitoramento e gerenciamento de painéis e telas digitais' 
  },
  '/super_admin/crm': { 
    section: 'CRM', 
    description: 'CRM unificado para gestão de clientes e leads' 
  },
  '/super_admin/financeiro': { 
    section: 'Financeiro', 
    description: 'Gestão financeira, faturamento e pagamentos' 
  },
  '/super_admin/propostas': { 
    section: 'Propostas', 
    description: 'Gerenciamento de propostas comerciais' 
  },
  '/super_admin/pedidos': { 
    section: 'Pedidos', 
    description: 'Visualização e gestão de pedidos' 
  },
  '/super_admin/videos': { 
    section: 'Vídeos', 
    description: 'Biblioteca de vídeos e aprovações' 
  },
  '/super_admin/campanhas': { 
    section: 'Campanhas', 
    description: 'Gerenciamento de campanhas publicitárias' 
  },
  '/super_admin/alertas': { 
    section: 'Alertas', 
    description: 'Central de alertas e notificações do sistema' 
  },
  '/super_admin/usuarios': { 
    section: 'Usuários', 
    description: 'Gestão de usuários e permissões' 
  },
  '/super_admin/locais': { 
    section: 'Locais', 
    description: 'Mapa e gerenciamento de locais/prédios' 
  },
  '/super_admin/configuracoes': { 
    section: 'Configurações', 
    description: 'Configurações gerais do sistema' 
  },
  '/admin': { 
    section: 'Admin Dashboard', 
    description: 'Dashboard do administrador' 
  },
  '/admin/campanhas': { 
    section: 'Minhas Campanhas', 
    description: 'Gerenciamento de campanhas do cliente' 
  },
  '/admin/pedidos': { 
    section: 'Meus Pedidos', 
    description: 'Visualização de pedidos do cliente' 
  },
  '/admin/videos': { 
    section: 'Meus Vídeos', 
    description: 'Biblioteca de vídeos do cliente' 
  },
};

export interface PageContext {
  path: string;
  section: string;
  description: string;
  fullContext: string;
}

export const usePageContext = () => {
  const location = useLocation();
  const [pageContext, setPageContext] = useState<PageContext>({
    path: location.pathname,
    section: 'Página',
    description: 'Navegando no sistema',
    fullContext: ''
  });

  const getContextForPath = useCallback((path: string): PageContext => {
    // Try exact match first
    let context = pageContextMap[path];
    
    // If no exact match, try to find a partial match
    if (!context) {
      const matchingKey = Object.keys(pageContextMap)
        .filter(key => path.startsWith(key))
        .sort((a, b) => b.length - a.length)[0];
      
      if (matchingKey) {
        context = pageContextMap[matchingKey];
      }
    }

    const section = context?.section || 'Página';
    const description = context?.description || `Página: ${path}`;
    const fullContext = `O usuário está na seção "${section}". ${description}. Rota atual: ${path}`;

    return {
      path,
      section,
      description,
      fullContext
    };
  }, []);

  useEffect(() => {
    const newContext = getContextForPath(location.pathname);
    setPageContext(newContext);
  }, [location.pathname, getContextForPath]);

  return pageContext;
};
