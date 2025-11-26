/**
 * Utilitários para formatação de nomes e telefones de contatos
 */

/**
 * Formata o nome de exibição de um contato
 * Trata casos especiais como @lid (WhatsApp Business Lead IDs) e grupos
 */
export const formatContactName = (
  contactName: string | null,
  contactPhone: string
): string => {
  // Se tem nome, usa o nome
  if (contactName && contactName.trim()) {
    return contactName;
  }

  // Se o telefone é um Lead ID do WhatsApp Business (@lid)
  if (contactPhone.includes('@lid')) {
    return 'Contato sem nome';
  }

  // Se é um grupo do WhatsApp
  if (contactPhone.includes('@g.us') || contactPhone.includes('-group')) {
    return 'Grupo WhatsApp';
  }

  // Se é um número normal, formata ele
  return formatPhoneNumber(contactPhone);
};

/**
 * Formata um número de telefone para exibição legível
 * Exemplo: 5545998090000 -> +55 (45) 99809-0000
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Se tem sufixo @c.us (WhatsApp), remove
  const number = phone.split('@')[0].replace(/\D/g, '');

  // Formato brasileiro: +55 (XX) XXXXX-XXXX
  if (number.length === 13 && number.startsWith('55')) {
    const ddd = number.substring(2, 4);
    const firstPart = number.substring(4, 9);
    const secondPart = number.substring(9, 13);
    return `+55 (${ddd}) ${firstPart}-${secondPart}`;
  }

  // Formato brasileiro: +55 (XX) XXXX-XXXX (fixo)
  if (number.length === 12 && number.startsWith('55')) {
    const ddd = number.substring(2, 4);
    const firstPart = number.substring(4, 8);
    const secondPart = number.substring(8, 12);
    return `+55 (${ddd}) ${firstPart}-${secondPart}`;
  }

  // Se não conseguir formatar, retorna o número limpo
  return number || phone;
};

/**
 * Retorna uma versão simplificada do telefone para exibição secundária
 */
export const formatPhoneSecondary = (phone: string): string => {
  // Se é um Lead ID, não mostra nada
  if (phone.includes('@lid')) {
    return 'ID do WhatsApp Business';
  }

  // Se é grupo
  if (phone.includes('@g.us') || phone.includes('-group')) {
    return 'Grupo';
  }

  // Retorna o telefone formatado
  return formatPhoneNumber(phone);
};

/**
 * Determina se um contato é um Lead ID do WhatsApp Business
 */
export const isWhatsAppLeadId = (phone: string): boolean => {
  return phone.includes('@lid');
};

/**
 * Determina se um contato é um grupo
 */
export const isWhatsAppGroup = (phone: string): boolean => {
  return phone.includes('@g.us') || phone.includes('-group');
};

/**
 * Formata o nome do contato com o nome do prédio/grupo
 * Exemplo: "Elaine Cristina - Vila Franciscatti"
 */
export const formatContactNameWithBuilding = (
  contactName: string | null,
  contactPhone: string,
  buildingName?: string | null
): string => {
  const name = formatContactName(contactName, contactPhone);
  
  // Se tem nome do prédio e não é um contato genérico, adicionar o prédio
  if (buildingName && buildingName.trim()) {
    // Evitar duplicação: se o nome já contém o nome do prédio, não duplicar
    if (!name.toLowerCase().includes(buildingName.toLowerCase())) {
      return `${name} - ${buildingName}`;
    }
  }
  
  return name;
};

/**
 * Capitaliza primeira letra de cada palavra
 */
const capitalize = (str: string): string => {
  return str.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

/**
 * Heurística para sugerir tipo de contato baseado em keywords
 */
export const suggestContactType = (conversation: {
  contact_name?: string | null;
  contact_phone: string;
  metadata?: {
    agent_saved_name?: string;
    building_name?: string;
  };
}): string => {
  const name = (conversation.contact_name || '').toLowerCase();
  const buildingName = (conversation.metadata?.agent_saved_name || conversation.metadata?.building_name || '').toLowerCase();
  const combinedText = `${name} ${buildingName}`;
  
  if (/tke|schindler|thyssen|elevador/i.test(combinedText)) return 'Prestador';
  if (/vivo|claro|oi|tim|provedor|internet|ligga/i.test(combinedText)) return 'Prestador';
  if (/síndico|sindico|condomínio|residencial|edif[íi]cio/i.test(combinedText)) return 'Síndico';
  if (/financeiro|cobrança|pagamento/i.test(combinedText)) return 'Administrativo';
  if (/anunciante|campanha|publicidade|mídia/i.test(combinedText)) return 'Anunciante';
  if (/exa|equipe/i.test(combinedText)) return 'Equipe Exa';
  
  return 'Contato';
};

/**
 * Constrói o título da conversa no formato:
 * [Agente] — [Tipo/Tag] (Nome do Contato)
 * Ex: "Eduardo — TKE (Ederson Souza)" ou "Eduardo — Síndico (Taelli VIVO)"
 */
export const buildConversationTitle = (conversation: {
  agent_key?: string;
  contact_name?: string | null;
  contact_phone: string;
  contact_type?: string | null;
  metadata?: {
    agent_saved_name?: string;
    building_name?: string;
  };
}): string => {
  // 1. Nome do Contato (WhatsApp)
  const contactName = conversation.contact_name || formatPhoneNumber(conversation.contact_phone);
  
  // 2. Nome salvo pelo agente (ZAPI/CRM) ou fallback para agent_key
  const agentSavedName = conversation.metadata?.agent_saved_name;
  const ownerLabel = agentSavedName 
    || capitalize(conversation.agent_key || 'Contato');
  
  // 3. Tipo de contato - prioridade: contact_type > heurística
  const contactType = conversation.contact_type && conversation.contact_type !== 'unknown'
    ? conversation.contact_type
    : suggestContactType(conversation);

  // 4. Construir título
  if (ownerLabel && ownerLabel !== contactName && ownerLabel !== 'Contato') {
    return `${ownerLabel} — ${contactType} (${contactName})`;
  }
  
  return `${contactName} — ${contactType}`;
};
