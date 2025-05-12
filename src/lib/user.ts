
import { supabase } from '@/integrations/supabase/client';

/**
 * Get user metadata from the auth session
 * This is a safer alternative to using the profiles table directly
 */
export const getUserProfile = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) {
    return null;
  }
  
  return {
    id: data.session.user.id,
    email: data.session.user.email,
    ...data.session.user.user_metadata
  };
};

/**
 * Update user metadata
 */
export const updateUserProfile = async (metadata: Record<string, any>) => {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata
  });
  
  if (error) {
    throw error;
  }
  
  return data.user;
};

/**
 * Format document number (CPF/CNPJ)
 */
export const formatDocument = (document: string, type: 'cpf' | 'cnpj'): string => {
  const digits = document.replace(/\D/g, '');
    
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

/**
 * Validate document number (CPF/CNPJ)
 */
export const validateDocument = (document: string, type: 'cpf' | 'cnpj'): boolean => {
  const digits = document.replace(/\D/g, '');
  
  if (type === 'cpf') {
    return digits.length === 11;
  } else {
    return digits.length === 14;
  }
};
