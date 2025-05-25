
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  type: 'user' | 'order' | 'building' | 'panel';
  title: string;
  subtitle: string;
  url: string;
}

export const useGlobalSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const performSearch = async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const searchPromises = [
        // Buscar usuários
        supabase
          .from('users')
          .select('id, email, role')
          .or(`email.ilike.%${term}%,role.ilike.%${term}%`)
          .limit(5),
        
        // Buscar pedidos
        supabase
          .from('pedidos')
          .select('id, client_id, valor_total, status')
          .or(`id.ilike.%${term}%,status.ilike.%${term}%`)
          .limit(5),
        
        // Buscar prédios
        supabase
          .from('buildings')
          .select('id, nome, endereco, bairro')
          .or(`nome.ilike.%${term}%,endereco.ilike.%${term}%,bairro.ilike.%${term}%`)
          .limit(5),
        
        // Buscar painéis
        supabase
          .from('painels')
          .select('id, code, status, building_id')
          .or(`code.ilike.%${term}%,status.ilike.%${term}%`)
          .limit(5)
      ];

      const [usersRes, ordersRes, buildingsRes, panelsRes] = await Promise.all(searchPromises);
      
      const searchResults: SearchResult[] = [];

      // Processar usuários
      if (usersRes.data) {
        usersRes.data.forEach(user => {
          searchResults.push({
            id: user.id,
            type: 'user',
            title: user.email,
            subtitle: `Função: ${user.role}`,
            url: '/super_admin/usuarios'
          });
        });
      }

      // Processar pedidos
      if (ordersRes.data) {
        ordersRes.data.forEach(order => {
          searchResults.push({
            id: order.id,
            type: 'order',
            title: `Pedido ${order.id.substring(0, 8)}...`,
            subtitle: `R$ ${order.valor_total?.toFixed(2)} - ${order.status}`,
            url: `/super_admin/pedidos/${order.id}`
          });
        });
      }

      // Processar prédios
      if (buildingsRes.data) {
        buildingsRes.data.forEach(building => {
          searchResults.push({
            id: building.id,
            type: 'building',
            title: building.nome,
            subtitle: `${building.endereco}, ${building.bairro}`,
            url: '/super_admin/predios'
          });
        });
      }

      // Processar painéis
      if (panelsRes.data) {
        panelsRes.data.forEach(panel => {
          searchResults.push({
            id: panel.id,
            type: 'panel',
            title: panel.code,
            subtitle: `Status: ${panel.status}`,
            url: '/super_admin/paineis'
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Erro na busca:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchTerm.trim()) {
      debounceRef.current = setTimeout(() => {
        performSearch(searchTerm);
      }, 300);
    } else {
      setResults([]);
      setIsLoading(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
  };

  return {
    searchTerm,
    setSearchTerm,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    clearSearch
  };
};
