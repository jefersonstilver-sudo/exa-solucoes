import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRequirementsProps {
  password: string;
  userName?: string;
}

interface Requirement {
  label: string;
  valid: boolean;
}

const hasSequentialNumbers = (str: string): boolean => {
  // Verifica sequências de 3 ou mais números consecutivos (123, 234, 345, etc)
  const sequences = ['012', '123', '234', '345', '456', '567', '678', '789'];
  const reverseSequences = ['987', '876', '765', '654', '543', '432', '321', '210'];
  return sequences.some(seq => str.includes(seq)) || reverseSequences.some(seq => str.includes(seq));
};

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ 
  password, 
  userName = '' 
}) => {
  const requirements: Requirement[] = [
    {
      label: 'Mínimo de 8 caracteres',
      valid: password.length >= 8
    },
    {
      label: 'Uma letra maiúscula (A-Z)',
      valid: /[A-Z]/.test(password)
    },
    {
      label: 'Uma letra minúscula (a-z)',
      valid: /[a-z]/.test(password)
    },
    {
      label: 'Um número (0-9)',
      valid: /[0-9]/.test(password)
    },
    {
      label: 'Um caractere especial (!@#$%^&*)',
      valid: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    },
    {
      label: 'Não contém seu nome',
      valid: !userName || !password.toLowerCase().includes(userName.toLowerCase().split(' ')[0])
    },
    {
      label: 'Sem números sequenciais',
      valid: !hasSequentialNumbers(password)
    }
  ];

  // Não mostrar nada se senha vazia
  if (!password) return null;

  const allValid = requirements.every(req => req.valid);

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-xs font-medium text-gray-700 mb-2">
        Requisitos de senha:
      </p>
      <div className="space-y-1.5">
        {requirements.map((requirement, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center text-xs transition-all duration-200",
              requirement.valid ? "text-green-600" : "text-gray-500"
            )}
          >
            <span className={cn(
              "mr-2 flex-shrink-0 transition-colors duration-200",
              requirement.valid ? "text-green-600" : "text-gray-400"
            )}>
              {requirement.valid ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
            </span>
            <span className={cn(
              "transition-colors duration-200",
              requirement.valid && "font-medium"
            )}>
              {requirement.label}
            </span>
          </div>
        ))}
      </div>
      {allValid && (
        <div className="mt-2 pt-2 border-t border-green-200">
          <p className="text-xs font-medium text-green-600 flex items-center">
            <Check className="h-3.5 w-3.5 mr-1" />
            Senha forte!
          </p>
        </div>
      )}
    </div>
  );
};

export const validatePassword = (password: string, userName?: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Senha deve ter no mínimo 8 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos uma letra maiúscula' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos uma letra minúscula' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos um número' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos um caractere especial' };
  }
  if (userName && password.toLowerCase().includes(userName.toLowerCase().split(' ')[0])) {
    return { valid: false, message: 'Senha não pode conter seu nome' };
  }
  if (hasSequentialNumbers(password)) {
    return { valid: false, message: 'Senha não pode conter números sequenciais' };
  }
  return { valid: true };
};
