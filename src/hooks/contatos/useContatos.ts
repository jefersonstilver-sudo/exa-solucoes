import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  Contact, 
  CategoriaContato, 
  ContatosFilters, 
  ContatosOrderBy, 
  ContatosOrderDirection 
} from '@/types/contatos';

interface UseContatosOptions {
  categoria?: CategoriaContato;
  search?: string;
  status?: string;
  bloqueado?: boolean;
  filters?: ContatosFilters;
  orderBy?: ContatosOrderBy;
  orderDirection?: ContatosOrderDirection;
  limit?: number;
}

export const useContatos = (options: UseContatosOptions = {}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' });

      // IMPORTANTE: Excluir categoria 'ocultar' por padrão
      // A menos que seja explicitamente solicitada
      if (options.categoria !== 'ocultar') {
        query = query.neq('categoria', 'ocultar');
      }

      // Filtro por categoria
      if (options.categoria) {
        query = query.eq('categoria', options.categoria);
      } else if (options.filters?.categoria) {
        query = query.eq('categoria', options.filters.categoria);
      }

      // Filtro por status
      if (options.status) {
        query = query.eq('status', options.status);
      } else if (options.filters?.status) {
        query = query.eq('status', options.filters.status);
      }

      // Filtro por bloqueado
      if (options.bloqueado !== undefined) {
        query = query.eq('bloqueado', options.bloqueado);
      } else if (options.filters?.bloqueado !== undefined) {
        query = query.eq('bloqueado', options.filters.bloqueado);
      }

      // Filtro por temperatura
      if (options.filters?.temperatura) {
        query = query.eq('temperatura', options.filters.temperatura);
      }

      // Filtro por origem
      if (options.filters?.origem) {
        query = query.eq('origem', options.filters.origem);
      }

      // Filtro por responsável
      if (options.filters?.responsavel_id) {
        query = query.eq('responsavel_id', options.filters.responsavel_id);
      }

      // Filtro por cidade
      if (options.filters?.cidade) {
        query = query.ilike('cidade', `%${options.filters.cidade}%`);
      }

      // Filtro por bairro
      if (options.filters?.bairro) {
        query = query.ilike('bairro', `%${options.filters.bairro}%`);
      }

      // Filtro por pontuação
      if (options.filters?.pontuacaoMin !== undefined) {
        query = query.gte('pontuacao_atual', options.filters.pontuacaoMin);
      }
      if (options.filters?.pontuacaoMax !== undefined) {
        query = query.lte('pontuacao_atual', options.filters.pontuacaoMax);
      }

      // Filtro por data de criação
      if (options.filters?.dataCriacaoInicio) {
        query = query.gte('created_at', options.filters.dataCriacaoInicio);
      }
      if (options.filters?.dataCriacaoFim) {
        query = query.lte('created_at', options.filters.dataCriacaoFim);
      }

      // Busca global
      const searchTerm = options.search || options.filters?.search;
      if (searchTerm) {
        query = query.or(
          `nome.ilike.%${searchTerm}%,empresa.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%`
        );
      }

      // Ordenação
      const orderBy = options.orderBy || 'created_at';
      const orderDirection = options.orderDirection || 'desc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Limite
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      setContacts((data as Contact[]) || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  }, [
    options.categoria, 
    options.search, 
    options.status, 
    options.bloqueado,
    options.filters,
    options.orderBy,
    options.orderDirection,
    options.limit
  ]);

  const fetchCounts = useCallback(async () => {
    try {
      // Buscar contagem por categoria
      const { data: categoriaData, error: categoriaError } = await supabase
        .from('contacts')
        .select('categoria');

      if (categoriaError) throw categoriaError;

      const countMap: Record<string, number> = {};
      (categoriaData || []).forEach((item: { categoria: string }) => {
        countMap[item.categoria] = (countMap[item.categoria] || 0) + 1;
      });
      setCounts(countMap);

      // Buscar contagem de bloqueados
      const { count: blocked, error: blockedError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('bloqueado', true);

      if (blockedError) throw blockedError;
      setBlockedCount(blocked || 0);

    } catch (error) {
      console.error('Erro ao buscar contagens:', error);
    }
  }, []);

  const createContact = async (contact: Partial<Contact>) => {
    try {
      // Validação: categoria é obrigatória
      if (!contact.categoria) {
        throw new Error('Categoria é obrigatória');
      }

      const { data: userData } = await supabase.auth.getUser();
      
      const insertData = {
        nome: contact.nome || '',
        telefone: contact.telefone || '',
        categoria: contact.categoria,
        sobrenome: contact.sobrenome,
        empresa: contact.empresa,
        email: contact.email,
        website: contact.website,
        cnpj: contact.cnpj,
        endereco: contact.endereco,
        bairro: contact.bairro,
        cidade: contact.cidade,
        estado: contact.estado,
        cep: contact.cep,
        temperatura: contact.temperatura,
        onde_anuncia_hoje: contact.onde_anuncia_hoje,
        publico_alvo: contact.publico_alvo,
        dores_identificadas: contact.dores_identificadas,
        observacoes_estrategicas: contact.observacoes_estrategicas,
        tomador_decisao: contact.tomador_decisao,
        cargo_tomador: contact.cargo_tomador,
        tipo_negocio: contact.tipo_negocio,
        origem: contact.origem || 'cadastro_manual',
        tags: contact.tags,
        instagram: contact.instagram,
        ticket_estimado: contact.ticket_estimado,
        logo_url: contact.logo_url,
        created_by: userData.user?.id,
        responsavel_id: contact.responsavel_id || userData.user?.id
      };
      
      const { data, error } = await supabase
        .from('contacts')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      toast.success('Contato criado com sucesso');
      fetchContacts();
      fetchCounts();
      return data as Contact;
    } catch (error: any) {
      console.error('Erro ao criar contato:', error);
      toast.error(error.message || 'Erro ao criar contato');
      throw error;
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>, skipRefetch = false) => {
    try {
      // Validação: não pode remover categoria
      if (updates.categoria === null || updates.categoria === undefined) {
        delete updates.categoria;
      }

      const { data, error } = await supabase
        .from('contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Se skipRefetch, não mostra toast nem recarrega (usado para drag-drop otimista)
      if (!skipRefetch) {
        toast.success('Contato atualizado com sucesso');
        fetchContacts();
      }
      
      return data as Contact;
    } catch (error: any) {
      console.error('Erro ao atualizar contato:', error);
      toast.error(error.message || 'Erro ao atualizar contato');
      throw error;
    }
  };

  // Atualização otimista para drag-and-drop (atualiza estado local imediatamente)
  const updateContactOptimistic = async (id: string, updates: Partial<Contact>) => {
    // Salvar estado anterior para rollback
    const previousContacts = [...contacts];
    
    // Atualizar estado local imediatamente
    setContacts(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
    ));

    try {
      await updateContact(id, updates, true);
      return true;
    } catch (error) {
      // Rollback em caso de erro
      setContacts(previousContacts);
      throw error;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Contato excluído com sucesso');
      fetchContacts();
      fetchCounts();
    } catch (error: any) {
      console.error('Erro ao excluir contato:', error);
      toast.error(error.message || 'Erro ao excluir contato');
      throw error;
    }
  };

  const archiveContact = async (id: string) => {
    return updateContact(id, { status: 'arquivado' });
  };

  const unarchiveContact = async (id: string) => {
    return updateContact(id, { status: 'ativo' });
  };

  const blockContact = async (id: string, motivo: string) => {
    return updateContact(id, { 
      bloqueado: true, 
      motivo_bloqueio: motivo 
    });
  };

  const unblockContact = async (id: string) => {
    return updateContact(id, { 
      bloqueado: false, 
      motivo_bloqueio: null 
    });
  };

  // Verificar duplicidade antes de criar
  const checkDuplicate = async (telefone?: string, email?: string, cnpj?: string) => {
    try {
      const conditions: string[] = [];
      
      if (telefone) conditions.push(`telefone.eq.${telefone}`);
      if (email) conditions.push(`email.eq.${email}`);
      if (cnpj) conditions.push(`cnpj.eq.${cnpj}`);

      if (conditions.length === 0) return null;

      const { data, error } = await supabase
        .from('contacts')
        .select('id, nome, empresa, telefone, email, cnpj, categoria')
        .or(conditions.join(','))
        .limit(5);

      if (error) throw error;
      return data as Partial<Contact>[];
    } catch (error) {
      console.error('Erro ao verificar duplicidade:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchCounts();
  }, [fetchContacts, fetchCounts]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
    const leads = counts['lead'] || 0;
    const anunciantes = counts['anunciante'] || 0;
    
    return {
      total,
      leads,
      anunciantes,
      blocked: blockedCount,
      newToday: contacts.filter(c => {
        const today = new Date().toDateString();
        return new Date(c.created_at).toDateString() === today;
      }).length
    };
  }, [counts, blockedCount, contacts]);

  return {
    contacts,
    loading,
    counts,
    stats,
    totalCount,
    blockedCount,
    fetchContacts,
    fetchCounts,
    createContact,
    updateContact,
    updateContactOptimistic,
    deleteContact,
    archiveContact,
    unarchiveContact,
    blockContact,
    unblockContact,
    checkDuplicate,
    refetch: fetchContacts
  };
};
