
import React from 'react';
import { validatePasswordStrength } from '@/utils/securityUtils';
import { Check, X, AlertTriangle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const { isValid, errors, score } = validatePasswordStrength(password);
  
  const requirements = [
    { label: 'Pelo menos 8 caracteres', test: password.length >= 8 },
    { label: 'Uma letra maiúscula', test: /[A-Z]/.test(password) },
    { label: 'Uma letra minúscula', test: /[a-z]/.test(password) },
    { label: 'Um número', test: /\d/.test(password) },
    { label: 'Um caractere especial', test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
    { label: 'Sem sequências comuns', test: !/123|abc|qwe|password|admin/i.test(password) },
    { label: 'Sem caracteres repetidos', test: !/(.)\1{2,}/.test(password) },
  ];
  
  if (!password) return null;
  
  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };
  
  const getStrengthText = (score: number) => {
    if (score <= 1) return 'Muito Fraca';
    if (score <= 2) return 'Fraca';
    if (score <= 3) return 'Média';
    if (score <= 4) return 'Forte';
    return 'Muito Forte';
  };
  
  return (
    <div className="mt-2 p-3 border rounded-lg bg-gray-50">
      <p className="text-sm font-medium mb-2">Força da senha:</p>
      
      {/* Strength Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(score)}`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <p className="text-xs mt-1 text-gray-600">
          {getStrengthText(score)} ({score}/5)
        </p>
      </div>
      
      {/* Requirements List */}
      <div className="space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {req.test ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
            <span className={req.test ? 'text-green-700' : 'text-gray-600'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
      
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-700">
              {errors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {isValid && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <p className="text-xs text-green-700 font-medium">
              Senha forte! Atende a todos os requisitos de segurança.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
