import { z } from 'zod';

// Schema de validação para email
export const emailSchema = z.string()
  .trim()
  .min(5, { message: "Email muito curto" })
  .max(255, { message: "Email muito longo (máximo 255 caracteres)" })
  .email({ message: "Email inválido" })
  .toLowerCase();

// Validar email
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  try {
    emailSchema.parse(email);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        error: error.errors[0]?.message || 'Email inválido' 
      };
    }
    return { valid: false, error: 'Erro ao validar email' };
  }
};

// Sanitizar email (remover espaços, converter para minúsculas)
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};
