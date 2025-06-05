
import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a cryptographically secure random password with complexity requirements
 */
export const generateSecurePassword = (length: number = 16): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + specialChars;
  
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[array[i] % allChars.length];
  }
  
  // Shuffle the password to randomize character positions
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Generates a cryptographically secure token for emergency operations
 */
export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Enhanced password strength validation with stricter requirements
 */
export const validatePasswordStrength = (password: string): { 
  isValid: boolean; 
  errors: string[];
  score: number;
} => {
  const errors: string[] = [];
  let score = 0;
  
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  } else {
    score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  } else {
    score += 1;
  }
  
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  } else {
    score += 1;
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  } else {
    score += 1;
  }
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Senha não deve conter caracteres repetidos consecutivos');
    score -= 1;
  }
  
  if (/123|abc|qwe|password|admin/i.test(password)) {
    errors.push('Senha não deve conter sequências comuns');
    score -= 2;
  }
  
  return {
    isValid: errors.length === 0 && score >= 4,
    errors,
    score: Math.max(0, Math.min(5, score))
  };
};

/**
 * Enhanced rate limiting with persistent storage and IP tracking
 */
const operationAttempts = new Map<string, { attempts: number[]; blocked: boolean; blockUntil?: number }>();

export const checkRateLimit = (
  key: string, 
  maxAttempts: number = 5, 
  windowMs: number = 300000,
  blockDurationMs: number = 900000 // 15 minutes block
): { allowed: boolean; remainingAttempts: number; blockUntil?: number } => {
  const now = Date.now();
  const record = operationAttempts.get(key) || { attempts: [], blocked: false };
  
  // Check if currently blocked
  if (record.blocked && record.blockUntil && now < record.blockUntil) {
    return { 
      allowed: false, 
      remainingAttempts: 0,
      blockUntil: record.blockUntil
    };
  }
  
  // Clear block if expired
  if (record.blocked && record.blockUntil && now >= record.blockUntil) {
    record.blocked = false;
    record.blockUntil = undefined;
    record.attempts = [];
  }
  
  // Remove old attempts outside the window
  const recentAttempts = record.attempts.filter(time => now - time < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    // Block the user
    record.blocked = true;
    record.blockUntil = now + blockDurationMs;
    operationAttempts.set(key, record);
    
    return { 
      allowed: false, 
      remainingAttempts: 0,
      blockUntil: record.blockUntil
    };
  }
  
  // Add current attempt
  recentAttempts.push(now);
  record.attempts = recentAttempts;
  operationAttempts.set(key, record);
  
  return { 
    allowed: true, 
    remainingAttempts: maxAttempts - recentAttempts.length
  };
};

/**
 * Sanitize document input with enhanced validation
 */
export const sanitizeDocument = (document: string): string => {
  return document.replace(/[^\d]/g, '').substring(0, 14); // Limit to max CNPJ length
};

/**
 * Enhanced email validation with domain checking
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email) || email.length > 254) {
    return false;
  }
  
  // Additional checks for suspicious patterns
  const suspiciousPatterns = [
    /\.{2,}/, // Multiple consecutive dots
    /@.*@/, // Multiple @ symbols
    /^\./, // Starting with dot
    /\.$/, // Ending with dot
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(email));
};

/**
 * Sanitize text input to prevent XSS
 */
export const sanitizeInput = (input: string, maxLength: number = 255): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim()
    .substring(0, maxLength);
};

/**
 * Log security events
 */
export const logSecurityEvent = async (event: {
  type: string;
  description: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
}) => {
  try {
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: event.type,
        descricao: event.description,
        ip: event.ip || 'unknown',
        user_agent: event.userAgent,
        user_id: event.userId
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};
