
import { useState } from 'react';

export const useDocumentValidation = () => {
  // Format document input with mask
  const formatDocument = (value: string, documentType: 'cpf' | 'cnpj'): string => {
    const digits = value.replace(/\D/g, '');
    
    if (documentType === 'cpf') {
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
  
  const validateDocument = (document: string, documentType: 'cpf' | 'cnpj'): boolean => {
    const digits = document.replace(/\D/g, '');
    
    if (documentType === 'cpf') {
      return digits.length === 11;
    } else {
      return digits.length === 14;
    }
  };

  return { formatDocument, validateDocument };
};
