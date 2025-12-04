/**
 * Utilitários para formatação e links do WhatsApp
 * Suporte a números internacionais (Brasil, Paraguai, Argentina)
 */

// Códigos de país suportados
export const COUNTRY_CODES = {
  BR: { code: '55', name: 'Brasil', flag: '🇧🇷' },
  PY: { code: '595', name: 'Paraguai', flag: '🇵🇾' },
  AR: { code: '54', name: 'Argentina', flag: '🇦🇷' },
  UY: { code: '598', name: 'Uruguai', flag: '🇺🇾' },
  CL: { code: '56', name: 'Chile', flag: '🇨🇱' },
  US: { code: '1', name: 'Estados Unidos', flag: '🇺🇸' },
} as const;

export type CountryCode = keyof typeof COUNTRY_CODES;

/**
 * Remove todos os caracteres não-numéricos do telefone
 */
export const cleanPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Detecta o país baseado no código do telefone
 */
export const detectCountryFromPhone = (phone: string): CountryCode | null => {
  const clean = cleanPhone(phone);
  
  if (clean.startsWith('595')) return 'PY';
  if (clean.startsWith('54')) return 'AR';
  if (clean.startsWith('598')) return 'UY';
  if (clean.startsWith('56')) return 'CL';
  if (clean.startsWith('55') || clean.length === 10 || clean.length === 11) return 'BR';
  if (clean.startsWith('1')) return 'US';
  
  return null;
};

/**
 * Formata o telefone para o formato brasileiro (XX) XXXXX-XXXX
 */
export const formatPhoneBR = (phone: string): string => {
  const clean = cleanPhone(phone);
  
  // Remove código do país se presente
  const withoutCountry = clean.startsWith('55') ? clean.slice(2) : clean;
  
  if (withoutCountry.length === 11) {
    return `(${withoutCountry.slice(0, 2)}) ${withoutCountry.slice(2, 7)}-${withoutCountry.slice(7)}`;
  } else if (withoutCountry.length === 10) {
    return `(${withoutCountry.slice(0, 2)}) ${withoutCountry.slice(2, 6)}-${withoutCountry.slice(6)}`;
  }
  
  return phone;
};

/**
 * Formata telefone com código de país para exibição
 */
export const formatPhoneDisplay = (phone: string, countryCode?: CountryCode): string => {
  const clean = cleanPhone(phone);
  const country = countryCode || detectCountryFromPhone(clean);
  
  if (!country) return phone;
  
  const countryData = COUNTRY_CODES[country];
  const withoutCountry = clean.startsWith(countryData.code) 
    ? clean.slice(countryData.code.length) 
    : clean;
  
  switch (country) {
    case 'BR':
      if (withoutCountry.length === 11) {
        return `+55 (${withoutCountry.slice(0, 2)}) ${withoutCountry.slice(2, 7)}-${withoutCountry.slice(7)}`;
      } else if (withoutCountry.length === 10) {
        return `+55 (${withoutCountry.slice(0, 2)}) ${withoutCountry.slice(2, 6)}-${withoutCountry.slice(6)}`;
      }
      break;
    case 'PY':
      // Paraguai: +595 XXX XXXXXX
      return `+595 ${withoutCountry.slice(0, 3)} ${withoutCountry.slice(3)}`;
    case 'AR':
      // Argentina: +54 XX XXXX XXXX
      return `+54 ${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2, 6)} ${withoutCountry.slice(6)}`;
    default:
      return `+${countryData.code} ${withoutCountry}`;
  }
  
  return phone;
};

/**
 * Formata o telefone para o padrão internacional do WhatsApp
 * Suporta múltiplos países
 */
export const formatPhoneForWhatsApp = (phone: string, countryCode?: CountryCode): string => {
  const clean = cleanPhone(phone);
  
  // Se já tem código de país conhecido, retorna limpo
  if (clean.startsWith('595') || clean.startsWith('54') || 
      clean.startsWith('55') || clean.startsWith('598') ||
      clean.startsWith('56') || clean.startsWith('1')) {
    return clean;
  }
  
  // Se código de país foi especificado, adiciona
  if (countryCode && COUNTRY_CODES[countryCode]) {
    return `${COUNTRY_CODES[countryCode].code}${clean}`;
  }
  
  // Default: assume Brasil
  return `55${clean}`;
};

/**
 * Gera o link do WhatsApp com suporte internacional
 */
export const getWhatsAppLink = (phone: string, countryCode?: CountryCode): string => {
  const formatted = formatPhoneForWhatsApp(phone, countryCode);
  return `https://wa.me/${formatted}`;
};

/**
 * Gera link do WhatsApp com mensagem pré-definida
 */
export const getWhatsAppLinkWithMessage = (
  phone: string, 
  message: string, 
  countryCode?: CountryCode
): string => {
  const formatted = formatPhoneForWhatsApp(phone, countryCode);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formatted}?text=${encodedMessage}`;
};

/**
 * Valida se o número de telefone é válido
 */
export const isValidPhone = (phone: string, countryCode?: CountryCode): boolean => {
  const clean = cleanPhone(phone);
  
  if (clean.length < 8) return false;
  
  if (countryCode) {
    const countryData = COUNTRY_CODES[countryCode];
    const withoutCountry = clean.startsWith(countryData.code) 
      ? clean.slice(countryData.code.length) 
      : clean;
    
    switch (countryCode) {
      case 'BR':
        return withoutCountry.length === 10 || withoutCountry.length === 11;
      case 'PY':
        return withoutCountry.length >= 8 && withoutCountry.length <= 10;
      case 'AR':
        return withoutCountry.length >= 8 && withoutCountry.length <= 12;
      default:
        return withoutCountry.length >= 8;
    }
  }
  
  return clean.length >= 10 && clean.length <= 15;
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

/**
 * Extrai código de país e número local de um telefone completo
 */
export const parseInternationalPhone = (phone: string): { 
  countryCode: CountryCode | null; 
  localNumber: string;
  fullNumber: string;
} => {
  const clean = cleanPhone(phone);
  const country = detectCountryFromPhone(clean);
  
  if (!country) {
    return { countryCode: null, localNumber: clean, fullNumber: clean };
  }
  
  const countryData = COUNTRY_CODES[country];
  const localNumber = clean.startsWith(countryData.code) 
    ? clean.slice(countryData.code.length) 
    : clean;
  
  return {
    countryCode: country,
    localNumber,
    fullNumber: `${countryData.code}${localNumber}`
  };
};
