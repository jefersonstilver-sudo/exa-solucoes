import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ContactType } from '../types/crmTypes';

export const useContactTypes = () => {
  const [contactTypes, setContactTypes] = useState<ContactType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContactTypes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_types')
        .select('*')
        .order('is_default', { ascending: false })
        .order('label', { ascending: true });

      if (error) throw error;
      setContactTypes((data as any) || []);
    } catch (error) {
      console.error('Error fetching contact types:', error);
      toast.error('Erro ao carregar tipos de contato');
    } finally {
      setLoading(false);
    }
  };

  const createContactType = async (name: string, label: string, color: string, icon: string) => {
    try {
      console.log('[CREATE CONTACT TYPE] Starting creation:', { name, label, color, icon });
      
      // Verificar sessão
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('[CREATE CONTACT TYPE] Session check:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        sessionError 
      });

      if (!session) {
        toast.error('Você precisa estar autenticado para criar tipos de contato');
        return;
      }

      const { data, error } = await supabase
        .from('contact_types')
        .insert({
          name,
          label,
          color,
          icon,
          is_default: false
        })
        .select();

      console.log('[CREATE CONTACT TYPE] Insert result:', { data, error });

      if (error) throw error;
      
      toast.success('Tipo de contato criado com sucesso');
      await fetchContactTypes();
    } catch (error: any) {
      console.error('[CREATE CONTACT TYPE] Error:', error);
      
      if (error.code === '23505') {
        toast.error('Já existe um tipo de contato com este nome');
      } else if (error.code === '42501') {
        toast.error('Você não tem permissão para criar tipos de contato. Apenas admins podem fazer isso.');
      } else {
        toast.error(`Erro ao criar tipo de contato: ${error.message || 'Erro desconhecido'}`);
      }
    }
  };

  const updateContactType = async (id: string, label: string, color: string, icon: string) => {
    try {
      const { error } = await supabase
        .from('contact_types')
        .update({ label, color, icon })
        .eq('id', id)
        .eq('is_default', false); // Apenas tipos não-default podem ser editados

      if (error) throw error;
      toast.success('Tipo de contato atualizado');
      await fetchContactTypes();
    } catch (error) {
      console.error('Error updating contact type:', error);
      toast.error('Erro ao atualizar tipo de contato');
    }
  };

  const deleteContactType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_types')
        .delete()
        .eq('id', id)
        .eq('is_default', false); // Apenas tipos não-default podem ser deletados

      if (error) throw error;
      toast.success('Tipo de contato removido');
      await fetchContactTypes();
    } catch (error) {
      console.error('Error deleting contact type:', error);
      toast.error('Erro ao remover tipo de contato');
    }
  };

  useEffect(() => {
    fetchContactTypes();
  }, []);

  return {
    contactTypes,
    loading,
    createContactType,
    updateContactType,
    deleteContactType,
    refetch: fetchContactTypes
  };
};