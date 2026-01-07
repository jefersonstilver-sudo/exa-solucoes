/**
 * Serviço para criação automática de contatos no CRM
 * Garante que todos os leads de todos os inputs do sistema sejam consolidados na tabela contacts
 */

import { supabase } from '@/integrations/supabase/client';

interface ContactCreationData {
  nome: string;
  sobrenome?: string;
  empresa?: string;
  cnpj?: string;
  telefone: string;
  email?: string;
  endereco?: string;
  origem: string;
  metadata?: Record<string, any>;
  created_by?: string;
}

interface ContactCreationResult {
  success: boolean;
  contactId?: string;
  isNew: boolean;
  error?: string;
}

/**
 * Cria ou atualiza um contato no CRM automaticamente
 * Evita duplicatas verificando telefone e CNPJ
 */
export async function createOrUpdateContact(data: ContactCreationData): Promise<ContactCreationResult> {
  try {
    console.log('[ContactAutoCreator] Iniciando criação/atualização de contato:', {
      nome: data.nome,
      telefone: data.telefone,
      cnpj: data.cnpj,
      origem: data.origem
    });

    // Limpar telefone para busca
    const cleanPhone = data.telefone?.replace(/\D/g, '') || '';
    
    if (!cleanPhone) {
      console.warn('[ContactAutoCreator] Telefone não fornecido, pulando criação de contato');
      return { success: false, isNew: false, error: 'Telefone obrigatório' };
    }

    // Verificar se já existe contato com esse telefone
    const { data: existingByPhone } = await supabase
      .from('contacts')
      .select('id, nome, cnpj')
      .or(`telefone.eq.${cleanPhone},telefone.ilike.%${cleanPhone}%`)
      .limit(1)
      .single();

    if (existingByPhone) {
      console.log('[ContactAutoCreator] Contato já existe por telefone:', existingByPhone.id);
      
      // Atualizar dados se tiver mais informações (CNPJ, empresa, etc.)
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
        last_action: `Proposta enviada via ${data.origem}`
      };
      
      // Atualizar campos vazios
      if (data.empresa && !existingByPhone.cnpj) {
        updates.empresa = data.empresa;
      }
      if (data.cnpj && !existingByPhone.cnpj) {
        updates.cnpj = data.cnpj?.replace(/\D/g, '');
      }
      
      await supabase
        .from('contacts')
        .update(updates)
        .eq('id', existingByPhone.id);

      return { success: true, contactId: existingByPhone.id, isNew: false };
    }

    // Verificar se já existe contato com esse CNPJ (se fornecido)
    if (data.cnpj) {
      const cleanCnpj = data.cnpj.replace(/\D/g, '');
      const { data: existingByCnpj } = await supabase
        .from('contacts')
        .select('id')
        .eq('cnpj', cleanCnpj)
        .limit(1)
        .single();

      if (existingByCnpj) {
        console.log('[ContactAutoCreator] Contato já existe por CNPJ:', existingByCnpj.id);
        
        // Atualizar telefone se não tiver
        await supabase
          .from('contacts')
          .update({ 
            telefone: cleanPhone,
            updated_at: new Date().toISOString(),
            last_action: `Proposta enviada via ${data.origem}`
          })
          .eq('id', existingByCnpj.id);

        return { success: true, contactId: existingByCnpj.id, isNew: false };
      }
    }

    // Criar novo contato
    const newContact = {
      nome: data.nome,
      sobrenome: data.sobrenome || null,
      empresa: data.empresa || null,
      cnpj: data.cnpj?.replace(/\D/g, '') || null,
      telefone: cleanPhone,
      email: data.email || null,
      endereco: data.endereco || null,
      origem: data.origem,
      categoria: 'lead', // Categoria padrão para leads de propostas
      temperatura: 'morno', // Temperatura inicial
      status: 'ativo',
      metadata: data.metadata ? data.metadata : null,
      created_by: data.created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_action: `Proposta criada via ${data.origem}`,
      last_contact_at: new Date().toISOString()
    };

    const { data: insertedContact, error } = await supabase
      .from('contacts')
      .insert([newContact])
      .select('id')
      .single();

    if (error) {
      console.error('[ContactAutoCreator] Erro ao criar contato:', error);
      return { success: false, isNew: false, error: error.message };
    }

    console.log('[ContactAutoCreator] ✅ Novo contato criado:', insertedContact.id);

    return { success: true, contactId: insertedContact.id, isNew: true };
  } catch (err: any) {
    console.error('[ContactAutoCreator] Erro inesperado:', err);
    return { success: false, isNew: false, error: err.message };
  }
}

/**
 * Cria contato a partir dos dados de uma proposta
 */
export async function createContactFromProposal(proposalData: {
  clientName: string;
  clientFirstName?: string;
  clientLastName?: string;
  clientCompanyName?: string;
  clientCnpj?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  createdBy?: string;
}): Promise<ContactCreationResult> {
  if (!proposalData.clientPhone) {
    console.warn('[ContactAutoCreator] Proposta sem telefone, não é possível criar contato');
    return { success: false, isNew: false, error: 'Telefone obrigatório' };
  }

  return createOrUpdateContact({
    nome: proposalData.clientFirstName || proposalData.clientName?.split(' ')[0] || 'Cliente',
    sobrenome: proposalData.clientLastName || proposalData.clientName?.split(' ').slice(1).join(' ') || undefined,
    empresa: proposalData.clientCompanyName,
    cnpj: proposalData.clientCnpj,
    telefone: proposalData.clientPhone,
    email: proposalData.clientEmail,
    endereco: proposalData.clientAddress,
    origem: 'proposta_comercial',
    created_by: proposalData.createdBy,
    metadata: {
      source: 'proposal_creation',
      created_from: 'nova_proposta_page'
    }
  });
}
