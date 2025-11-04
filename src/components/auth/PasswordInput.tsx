import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  id: string;
  label: string;
  validator: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'minLength',
    label: 'Pelo menos 8 caracteres',
    validator: (pwd) => pwd.length >= 8
  },
  {
    id: 'uppercase',
    label: 'Pelo menos uma letra maiúscula (A-Z)',
    validator: (pwd) => /[A-Z]/.test(pwd)
  },
  {
    id: 'number',
    label: 'Pelo menos um número (0-9)',
    validator: (pwd) => /[0-9]/.test(pwd)
  },
  {
    id: 'special',
    label: 'Pelo menos um caractere especial (!@#$%^&*)',
    validator: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
  }
];

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'Digite sua senha',
  required = false,
  showRequirements = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const checkRequirement = (requirement: PasswordRequirement) => {
    return requirement.validator(value);
  };

  const allRequirementsMet = passwordRequirements.every(req => checkRequirement(req));

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center text-gray-900">
        <Lock className="h-4 w-4 mr-2 text-indexa-purple" />
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className="border-indexa-purple/20 focus:border-indexa-purple h-11 text-gray-900 placeholder-gray-500 pr-10"
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Requisitos de Senha */}
      {showRequirements && (isFocused || value.length > 0) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Requisitos da senha:
          </p>
          <ul className="space-y-1.5">
            {passwordRequirements.map((requirement) => {
              const isValid = checkRequirement(requirement);
              return (
                <motion.li
                  key={requirement.id}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center text-xs"
                >
                  {isValid ? (
                    <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  )}
                  <span className={isValid ? 'text-green-700 font-medium' : 'text-gray-600'}>
                    {requirement.label}
                  </span>
                </motion.li>
              );
            })}
          </ul>
          
          {allRequirementsMet && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md"
            >
              <p className="text-xs font-semibold text-green-700 flex items-center">
                <Check className="h-4 w-4 mr-1" />
                Senha forte! Todos os requisitos atendidos.
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// Função auxiliar para validar senha
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  passwordRequirements.forEach(requirement => {
    if (!requirement.validator(password)) {
      errors.push(requirement.label);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
