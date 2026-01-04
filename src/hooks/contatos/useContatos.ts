import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Contact, CategoriaContato } from '@/types/contatos';

interface UseContatosOptions {
  categoria?: CategoriaContato;
  search?: string;
  status?: string;
  bloqueado?: boolean;
}

export const useContatos = (options: UseContatosOptions = {}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (options.categoria) {
        query = query.eq('categoria', options.categoria);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.bloqueado !== undefined) {
        query = query.eq('bloqueado', options.bloqueado);
      }

      if (options.search) {
        query = query.or(`nome.ilike.%${options.search}%,empresa.ilike.%${options.search}%,telefone.ilike.%${options.search}%,email.ilike.%${options.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContacts((data as Contact[]) || []);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  }, [options.categoria, options.search, options.status, options.bloqueado]);

  const fetchCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('categoria');

      if (error) throw error;

      const countMap: Record<string, number> = {};
      (data || []).forEach((item: { categoria: string }) => {
        countMap[item.categoria] = (countMap[item.categoria] || 0) + 1;
      });
      setCounts(countMap);
    } catch (error) {
      console.error('Erro ao buscar contagens:', error);
    }
  }, []);

  const createContact = async (contact: Partial<Contact>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const insertData = {
        nome: contact.nome || '',
        telefone: contact.telefone || '',
        categoria: contact.categoria || 'lead',
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
        origem: contact.origem,
        tags: contact.tags,
        created_by: userData.user?.id,
        responsavel_id: userData.user?.id
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

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Contato atualizado com sucesso');
      fetchContacts();
      return data as Contact;
    } catch (error: any) {
      console.error('Erro ao atualizar contato:', error);
      toast.error(error.message || 'Erro ao atualizar contato');
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

  useEffect(() => {
    fetchContacts();
    fetchCounts();
  }, [fetchContacts, fetchCounts]);

  return {
    contacts,
    loading,
    counts,
    fetchContacts,
    fetchCounts,
    createContact,
    updateContact,
    deleteContact
  };
};
