
import { sanitizeInput } from '@/utils/securityUtils';

export const useDocumentValidation = () => {
  const formatDocument = (value: string, type: 'cpf' | 'documento_estrangeiro'): string => {
    // Sanitize input first to prevent any malicious input
    const sanitized = sanitizeInput(value.replace(/[^\d]/g, ''), 14);
    const digits = sanitized;
    
    if (type === 'cpf') {
      // Format: 000.000.000-00
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    } else {
      // Para documento estrangeiro, apenas retorna os dígitos sem formatação específica
      return digits;
    }
  };

  const validateDocument = (document: string, type: 'cpf' | 'documento_estrangeiro'): boolean => {
    const digits = sanitizeInput(document.replace(/[^\d]/g, ''), 14);
    
    if (type === 'cpf') {
      if (digits.length !== 11) return false;
      
      // Check for invalid sequences (all same digits)
      if (/^(\d)\1{10}$/.test(digits)) return false;
      
      // CPF validation algorithm
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(digits.charAt(i)) * (10 - i);
      }
      let remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(digits.charAt(9))) return false;

      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(digits.charAt(i)) * (11 - i);
      }
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      return remainder === parseInt(digits.charAt(10));
    } else {
      // Para documento estrangeiro, apenas verifica se tem pelo menos 5 dígitos
      return digits.length >= 5 && digits.length <= 20;
    }
  };

  return {
    formatDocument,
    validateDocument
  };
};
