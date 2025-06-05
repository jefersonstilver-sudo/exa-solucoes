
import React from 'react';
import { validatePasswordStrength } from '@/utils/securityUtils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const { isValid, errors } = validatePasswordStrength(password);
  
  const requirements = [
    { label: 'Pelo menos 8 caracteres', test: password.length >= 8 },
    { label: 'Uma letra maiúscula', test: /[A-Z]/.test(password) },
    { label: 'Uma letra minúscula', test: /[a-z]/.test(password) },
    { label: 'Um número', test: /\d/.test(password) },
    { label: 'Um caractere especial', test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  
  if (!password) return null;
  
  return (
    <div className="mt-2 p-3 border rounded-lg bg-gray-50">
      <p className="text-sm font-medium mb-2">Requisitos da senha:</p>
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
      <div className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isValid ? 'bg-green-500' : 
              requirements.filter(r => r.test).length >= 3 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${(requirements.filter(r => r.test).length / requirements.length) * 100}%` }}
          />
        </div>
        <p className="text-xs mt-1 text-gray-600">
          Força: {isValid ? 'Forte' : requirements.filter(r => r.test).length >= 3 ? 'Média' : 'Fraca'}
        </p>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
