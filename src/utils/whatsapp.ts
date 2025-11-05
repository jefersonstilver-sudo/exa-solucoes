/**
 * Utilitários para formatação e links do WhatsApp
 */

/**
 * Remove todos os caracteres não-numéricos do telefone
 */
export const cleanPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Formata o telefone para o formato brasileiro (XX) XXXXX-XXXX
 */
export const formatPhoneBR = (phone: string): string => {
  const clean = cleanPhone(phone);
  
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  } else if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  
  return phone;
};

/**
 * Formata o telefone para o padrão internacional do WhatsApp (55XXXXXXXXXXX)
 */
export const formatPhoneForWhatsApp = (phone: string): string => {
  const clean = cleanPhone(phone);
  return clean.startsWith('55') ? clean : `55${clean}`;
};

/**
 * Gera o link do WhatsApp
 */
export const getWhatsAppLink = (phone: string): string => {
  const formatted = formatPhoneForWhatsApp(phone);
  return `https://wa.me/${formatted}`;
};

/**
 * Copia texto para a área de transferência
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
