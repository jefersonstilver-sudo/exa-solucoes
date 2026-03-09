import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export interface AdminOrderFormData {
  // Client
  clientId: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientDocument: string;
  proposalId: string | null;
  
  // Product
  tipoProduto: string; // 'horizontal' | 'vertical_premium'
  
  // Config
  listaPredios: string[];
  listaPaineis: string[];
  planoMeses: number;
  valorTotal: number;
  dataInicio: string;
  dataFim: string;
  metodoPagamento: string;
  statusInicial: string;
  logoFile: File | null;
}

const initialFormData: AdminOrderFormData = {
  clientId: null,
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientDocument: '',
  proposalId: null,
  tipoProduto: 'horizontal',
  listaPredios: [],
  listaPaineis: [],
  planoMeses: 1,
  valorTotal: 0,
  dataInicio: '',
  dataFim: '',
  metodoPagamento: 'pix_avista',
  statusInicial: 'pendente',
  logoFile: null,
};

export function useAdminCreateOrder() {
  const [formData, setFormData] = useState<AdminOrderFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const updateField = <K extends keyof AdminOrderFormData>(key: K, value: AdminOrderFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setFormData(initialFormData);

  // Search clients
  const searchClients = async (term: string) => {
    if (term.length < 2) return [];
    const { data } = await supabase
      .from('users')
      .select('id, nome, email, telefone, primeiro_nome, sobrenome, avatar_url')
      .or(`nome.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(10);
    return data || [];
  };

  // Search proposals
  const searchProposals = async (term: string) => {
    if (term.length < 2) return [];
    const { data } = await supabase
      .from('proposals')
      .select('id, client_name, client_email, client_phone, status, total_amount')
      .or(`client_name.ilike.%${term}%,client_email.ilike.%${term}%`)
      .in('status', ['accepted', 'sent', 'draft'])
      .limit(10);
    return data || [];
  };

  // Activate account
  const activateAccount = async (email: string) => {
    const { data, error } = await supabase.functions.invoke('admin-update-user', {
      body: { email, confirm_email: true }
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Erro ao ativar conta');
    toast.success('Conta ativada com sucesso');
    return data;
  };

  // Create account
  const createAccount = async () => {
    const nameParts = formData.clientName.trim().split(' ');
    const primeiro_nome = nameParts[0] || '';
    const sobrenome = nameParts.slice(1).join(' ') || '';
    
    const { data, error } = await supabase.functions.invoke('create-client-account', {
      body: {
        email: formData.clientEmail,
        password: 'exa2025',
        primeiro_nome,
        sobrenome,
        telefone: formData.clientPhone,
        role: 'client'
      }
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Erro ao criar conta');
    updateField('clientId', data.userId);
    toast.success('Conta criada com sucesso');
    return data;
  };

  // Upload logo
  const uploadLogo = async (userId: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `PAGINA PRINCIPAL LOGOS/${userId}_logo.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('arquivos')
      .upload(path, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    await supabase.from('users').update({ avatar_url: path }).eq('id', userId);
    toast.success('Logo enviada');
  };

  // Submit order
  const submitOrder = async () => {
    setIsSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const adminId = authData.user?.id;

      if (!formData.clientId && !formData.clientEmail) {
        throw new Error('Selecione ou cadastre um cliente');
      }

      let clientId = formData.clientId;

      // Create account if no clientId
      if (!clientId && formData.clientEmail) {
        const result = await createAccount();
        clientId = result.userId;
      }

      if (!clientId) throw new Error('ID do cliente não encontrado');

      // Upload logo if provided
      if (formData.logoFile) {
        await uploadLogo(clientId, formData.logoFile);
      }

      // Get product info for slot creation
      const { data: produto } = await supabase
        .from('produtos_exa')
        .select('max_videos_por_pedido, duracao_video_segundos')
        .eq('codigo', formData.tipoProduto)
        .single();

      // Insert order
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          client_id: clientId,
          client_name: formData.clientName,
          email: formData.clientEmail,
          tipo_produto: formData.tipoProduto,
          lista_predios: formData.listaPredios,
          lista_paineis: formData.listaPaineis,
          plano_meses: formData.planoMeses,
          valor_total: formData.valorTotal,
          data_inicio: formData.dataInicio || null,
          data_fim: formData.dataFim || null,
          metodo_pagamento: formData.metodoPagamento,
          status: formData.statusInicial,
          created_by_admin: adminId,
          proposal_id: formData.proposalId,
          sem_slots_video: true,
          termos_aceitos: true,
        } as any)
        .select('id')
        .single();

      if (pedidoError) throw pedidoError;

      // Create empty video slots
      const maxSlots = produto?.max_videos_por_pedido || 1;
      
      // We need a placeholder video_id - use a UUID placeholder
      // The system expects video_id to be non-null, so we create slots only if sem_slots_video is handled
      // Actually let's skip slot creation since sem_slots_video = true
      // Slots will be created when admin uploads videos later

      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-attempts-refactored'] });
      
      toast.success(`Pedido criado com sucesso! ID: ${pedido.id.slice(0, 8)}...`);
      resetForm();
      return pedido;
    } catch (error: any) {
      toast.error(`Erro ao criar pedido: ${error.message}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    updateField,
    resetForm,
    searchClients,
    searchProposals,
    activateAccount,
    createAccount,
    submitOrder,
    isSubmitting,
  };
}
