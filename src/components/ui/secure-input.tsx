import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { validateAndSanitizeText, validateEmail } from '@/utils/inputValidation';
import { cn } from '@/lib/utils';

interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  securityType?: 'email' | 'text' | 'role' | 'password';
  maxLength?: number;
  showValidation?: boolean;
  onSecureChange?: (value: string, isValid: boolean) => void;
}

const SecureInput: React.FC<SecureInputProps> = ({
  label,
  value = '',
  onChange,
  onSecureChange,
  securityType = 'text',
  maxLength = 255,
  showValidation = true,
  className,
  ...props
}) => {
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState('');
  const [sanitizedValue, setSanitizedValue] = useState('');

  useEffect(() => {
    if (typeof value === 'string') {
      validateInput(value);
    }
  }, [value, securityType, maxLength]);

  const validateInput = (inputValue: string) => {
    if (!inputValue || inputValue.trim().length === 0) {
      setIsValid(true);
      setValidationMessage('');
      setSanitizedValue('');
      return;
    }

    // Validate and sanitize
    const result = validateAndSanitizeText(inputValue, maxLength);
    
    let valid = result.isValid;
    let message = result.error || '';

    // Additional validation based on type
    if (valid && securityType === 'email') {
      valid = validateEmail(inputValue);
      if (!valid) message = 'Formato de email inválido';
    }

    if (valid && securityType === 'role') {
      const validRoles = ['client', 'admin', 'admin_marketing', 'super_admin', 'painel'];
      valid = validRoles.includes(inputValue);
      if (!valid) message = 'Role inválido';
    }

    if (valid && securityType === 'password') {
      valid = inputValue.length >= 8;
      if (!valid) message = 'Senha deve ter pelo menos 8 caracteres';
    }

    setIsValid(valid);
    setValidationMessage(message);
    setSanitizedValue(result.sanitized);

    // Notify parent component
    if (onSecureChange) {
      onSecureChange(result.sanitized, valid);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    validateInput(newValue);
    
    if (onChange) {
      onChange(e);
    }
  };

  const getValidationIcon = () => {
    if (!showValidation || !value) return null;
    
    if (isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getSecurityBadge = () => {
    if (!showValidation) return null;
    
    return (
      <Badge 
        variant={isValid ? "default" : "destructive"} 
        className="text-xs"
      >
        <Shield className="h-3 w-3 mr-1" />
        {isValid ? 'Seguro' : 'Inválido'}
      </Badge>
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={props.id}>{label}</Label>
          {showValidation && getSecurityBadge()}
        </div>
      )}
      
      <div className="relative">
        <Input
          {...props}
          value={value}
          onChange={handleChange}
          className={cn(
            className,
            !isValid && value && "border-red-300 focus:border-red-500",
            isValid && value && "border-green-300 focus:border-green-500"
          )}
        />
        
        {showValidation && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {getValidationIcon()}
          </div>
        )}
      </div>

      {showValidation && !isValid && validationMessage && (
        <p className="text-sm text-red-600 flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {validationMessage}
        </p>
      )}
      
      {showValidation && isValid && value && securityType !== 'password' && (
        <p className="text-xs text-green-600 flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          Entrada validada e segura
        </p>
      )}
    </div>
  );
};

export default SecureInput;