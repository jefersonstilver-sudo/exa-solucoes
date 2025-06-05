
import { sanitizeInput } from '@/utils/securityUtils';

export const useDocumentValidation = () => {
  const formatDocument = (value: string, type: 'cpf' | 'cnpj'): string => {
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
      // Format: 00.000.000/0000-00
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
      if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
      if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
    }
  };

  const validateDocument = (document: string, type: 'cpf' | 'cnpj'): boolean => {
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
      if (digits.length !== 14) return false;
      
      // Check for invalid sequences (all same digits)
      if (/^(\d)\1{13}$/.test(digits)) return false;
      
      // CNPJ validation algorithm
      const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(digits.charAt(i)) * weights1[i];
      }
      let remainder = sum % 11;
      const digit1 = remainder < 2 ? 0 : 11 - remainder;
      if (digit1 !== parseInt(digits.charAt(12))) return false;

      sum = 0;
      for (let i = 0; i < 13; i++) {
        sum += parseInt(digits.charAt(i)) * weights2[i];
      }
      remainder = sum % 11;
      const digit2 = remainder < 2 ? 0 : 11 - remainder;
      return digit2 === parseInt(digits.charAt(13));
    }
  };

  return {
    formatDocument,
    validateDocument
  };
};
