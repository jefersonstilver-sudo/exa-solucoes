
/**
 * Secure input validation utilities
 */

// CPF validation
export const validateCPF = (cpf: string): boolean => {
  const cleanCpf = cpf.replace(/[^\d]/g, '');
  
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf[10])) return false;
  
  return true;
};

// CNPJ validation
export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cleanCnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCnpj[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCnpj[12])) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCnpj[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCnpj[13])) return false;
  
  return true;
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Phone validation (Brazilian format)
export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

// Sanitize HTML content to prevent XSS
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validate and sanitize text input
export const validateAndSanitizeText = (
  input: string, 
  maxLength: number = 255,
  allowHtml: boolean = false
): { isValid: boolean; sanitized: string; error?: string } => {
  if (!input || typeof input !== 'string') {
    return { isValid: false, sanitized: '', error: 'Input is required' };
  }
  
  if (input.length > maxLength) {
    return { 
      isValid: false, 
      sanitized: '', 
      error: `Input must be less than ${maxLength} characters` 
    };
  }
  
  const sanitized = allowHtml ? input.trim() : sanitizeHtml(input.trim());
  
  return { isValid: true, sanitized };
};

// Validate numeric input
export const validateNumeric = (
  input: string | number,
  min?: number,
  max?: number
): { isValid: boolean; value: number; error?: string } => {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(num)) {
    return { isValid: false, value: 0, error: 'Must be a valid number' };
  }
  
  if (min !== undefined && num < min) {
    return { isValid: false, value: num, error: `Must be greater than or equal to ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { isValid: false, value: num, error: `Must be less than or equal to ${max}` };
  }
  
  return { isValid: true, value: num };
};
