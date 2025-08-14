import { useMemo } from 'react';
import { validateDocument } from '@/lib/user';

interface UserSettings {
  name?: string;
  cpf?: string;
  documento_estrangeiro?: string;
  documento_frente_url?: string;
  documento_verso_url?: string;
  tipo_documento?: 'cpf' | 'documento_estrangeiro';
}

interface ProfileValidation {
  isProfileComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

export const useProfileValidation = (settings: UserSettings): ProfileValidation => {
  return useMemo(() => {
    const missing: string[] = [];
    
    // Validar nome completo
    if (!settings.name?.trim()) {
      missing.push('Nome Completo');
    }
    
    // Validar documento baseado no tipo
    if (settings.tipo_documento === 'cpf') {
      if (!settings.cpf || !validateDocument(settings.cpf, 'cpf')) {
        missing.push('CPF válido');
      }
    } else {
      if (!settings.documento_estrangeiro?.trim()) {
        missing.push('Documento Estrangeiro');
      }
      if (!settings.documento_frente_url) {
        missing.push('Foto da Frente do Documento');
      }
      if (!settings.documento_verso_url) {
        missing.push('Foto do Verso do Documento');
      }
    }
    
    const totalFields = 2; // Nome + Documento
    const completedFields = totalFields - (missing.length > 0 ? 1 : 0) - (settings.name?.trim() ? 0 : 1);
    const completionPercentage = Math.round((completedFields / totalFields) * 100);
    
    return {
      isProfileComplete: missing.length === 0,
      missingFields: missing,
      completionPercentage
    };
  }, [settings]);
};