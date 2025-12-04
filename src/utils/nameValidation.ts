/**
 * Utilitários globais de validação e formatação de nomes
 * Usado em todo o sistema para garantir consistência
 */

export interface NameValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida que primeiro nome e sobrenome são válidos
 * Ambos campos são obrigatórios com mínimo de 2 caracteres
 */
export const validateFullName = (firstName: string, lastName: string): NameValidationResult => {
  const trimmedFirst = firstName?.trim() || '';
  const trimmedLast = lastName?.trim() || '';

  if (!trimmedFirst) {
    return { valid: false, error: 'Primeiro nome é obrigatório' };
  }
  if (trimmedFirst.length < 2) {
    return { valid: false, error: 'Primeiro nome deve ter pelo menos 2 caracteres' };
  }
  if (!trimmedLast) {
    return { valid: false, error: 'Sobrenome é obrigatório' };
  }
  if (trimmedLast.length < 2) {
    return { valid: false, error: 'Sobrenome deve ter pelo menos 2 caracteres' };
  }
  
  // Verificar se contém apenas letras e espaços
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!nameRegex.test(trimmedFirst)) {
    return { valid: false, error: 'Primeiro nome contém caracteres inválidos' };
  }
  if (!nameRegex.test(trimmedLast)) {
    return { valid: false, error: 'Sobrenome contém caracteres inválidos' };
  }

  return { valid: true };
};

/**
 * Formata nome completo a partir de primeiro nome e sobrenome
 */
export const formatFullName = (firstName: string, lastName: string): string => {
  const first = capitalizeNameParts(firstName?.trim() || '');
  const last = capitalizeNameParts(lastName?.trim() || '');
  return `${first} ${last}`.trim();
};

/**
 * Capitaliza cada parte do nome
 * "JOAO SILVA" -> "Joao Silva"
 * "maria santos" -> "Maria Santos"
 */
export const capitalizeNameParts = (name: string): string => {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => {
      if (word.length === 0) return '';
      // Preservar partículas como "da", "de", "do", "dos", "das"
      const particles = ['da', 'de', 'do', 'dos', 'das', 'e'];
      if (particles.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Extrai primeiro nome e sobrenome de um nome completo
 * Útil para migração de dados legados
 */
export const splitFullName = (fullName: string): { firstName: string; lastName: string } => {
  const trimmed = fullName?.trim() || '';
  const parts = trimmed.split(/\s+/);
  
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  
  // Primeiro nome é a primeira parte, sobrenome é o resto
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  
  return { firstName, lastName };
};

/**
 * Valida um nome único (para casos onde só precisa de um campo)
 */
export const validateSingleName = (name: string): NameValidationResult => {
  const trimmed = name?.trim() || '';
  
  if (!trimmed) {
    return { valid: false, error: 'Nome é obrigatório' };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'Nome deve ter pelo menos 2 caracteres' };
  }
  
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: 'Nome contém caracteres inválidos' };
  }
  
  return { valid: true };
};
