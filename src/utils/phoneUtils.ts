/**
 * Format phone number for display
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Se começar com 55 (Brasil)
  if (numbers.startsWith('55')) {
    const ddd = numbers.slice(2, 4);
    const part1 = numbers.slice(4, 9);
    const part2 = numbers.slice(9, 13);
    
    if (numbers.length <= 4) return `+55 ${numbers.slice(2)}`;
    if (numbers.length <= 6) return `+55 ${ddd}`;
    if (numbers.length <= 11) return `+55 ${ddd} ${part1}`;
    return `+55 ${ddd} ${part1}-${part2}`;
  }
  
  // Se começar com outro código de país
  if (numbers.length > 10) {
    return `+${numbers}`;
  }
  
  // Formato brasileiro padrão
  const ddd = numbers.slice(0, 2);
  const part1 = numbers.slice(2, 7);
  const part2 = numbers.slice(7, 11);
  
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${ddd}) ${part1}`;
  return `(${ddd}) ${part1}-${part2}`;
};

/**
 * Extract raw phone number for API calls (only digits with country code)
 */
export const extractRawPhone = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  // Se não começar com código de país, assume Brasil
  if (!numbers.startsWith('55') && numbers.length === 11) {
    return `55${numbers}`;
  }
  
  return numbers;
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const numbers = phone.replace(/\D/g, '');
  return numbers.length >= 10 && numbers.length <= 15;
};
