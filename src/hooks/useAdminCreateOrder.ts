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
  clientAccountActive: boolean | null; // null = unknown, true = active, false = not active
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
  clientAccountActive: null,
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

  // Search clients - includes empresa_nome and email_verified check
  const searchClients = async (term: string) => {
    if (term.length < 2) return [];
    const { data } = await supabase
      .from('users')
      .select('id, nome, email, telefone, primeiro_nome, sobrenome, avatar_url, empresa_nome')
      .or(`nome.ilike.%${term}%,email.ilike.%${term}%,empresa_nome.ilike.%${term}%`)
      .limit(10);
    
    if (!data || data.length === 0) return [];

    // Check account activation status via edge function for each user
    // We'll do a lightweight check using admin-update-user or just return the data
    // The activation check will happen when a client is selected
    return data;
  };

  // Check if client account is active (email confirmed)
  const checkAccountStatus = async (emailOrId: string, isEmail = false): Promise<{ exists: boolean; active: boolean; userId?: string }> => {
    try {
      const body = isEmail ? { email: emailOrId, check_only: true } : { user_id: emailOrId, check_only: true };
      const { data } = await supabase.functions.invoke('admin-update-user', { body });
      return {
        exists: data?.user_exists === true,
        active: data?.email_confirmed === true,
        userId: data?.user_id || undefined,
      };
    } catch {
      return { exists: false, active: false };
    }
  };

  // Search proposals - includes company name, tipo_produto, duration, buildings, value
  const searchProposals = async (term: string) => {
    if (term.length < 2) return [];
    const { data, error } = await supabase
      .from('proposals')
      .select('id, number, client_name, client_company_name, client_email, client_phone, status, tipo_produto, duration_months, fidel_monthly_value, cash_total_value, selected_buildings')
      .or(`client_name.ilike.%${term}%,client_email.ilike.%${term}%,client_company_name.ilike.%${term}%,number.ilike.%${term}%`)
      .in('status', ['enviada', 'rascunho', 'visualizada', 'visualizando', 'atualizada'])
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) {
      console.error('❌ Erro ao buscar propostas:', error.message, error.details, error.hint);
      return [];
    }
    return data || [];
  };

  // Activate account
  const activateAccount = async (email: string) => {
    const { data, error } = await supabase.functions.invoke('admin-update-user', {
      body: { email, confirm_email: true }
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Erro ao ativar conta');
    updateField('clientAccountActive', true);
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
    updateField('clientAccountActive', true); // newly created accounts are auto-confirmed
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

  // Log activity
  const logOrderActivity = async (action: string, entityType: string, entityId?: string, details?: Record<string, any>) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) return;

      await supabase.from('user_activity_logs').insert({
        user_id: userId,
        action_type: action,
        entity_type: entityType,
        entity_id: entityId,
        action_description: details ? JSON.stringify(details) : null,
        metadata: {
          timestamp: new Date().toISOString(),
          context: 'admin_create_order'
        }
      });
    } catch (err) {
      console.error('Erro ao registrar log:', err);
    }
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

      // Create account if no clientId - check if exists first to avoid duplicate key error
      if (!clientId && formData.clientEmail) {
        const status = await checkAccountStatus(formData.clientEmail, true);
        if (status.exists && status.userId) {
          clientId = status.userId;
        } else {
          const result = await createAccount();
          clientId = result.userId;
        }
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

      // Log order creation
      await logOrderActivity('create', 'pedido', pedido.id, {
        client_id: clientId,
        client_name: formData.clientName,
        tipo_produto: formData.tipoProduto,
        lista_predios: formData.listaPredios,
        plano_meses: formData.planoMeses,
        valor_total: formData.valorTotal,
        proposal_id: formData.proposalId,
        created_by_admin: adminId,
      });

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
    checkAccountStatus,
    activateAccount,
    createAccount,
    submitOrder,
    isSubmitting,
    logOrderActivity,
  };
}
