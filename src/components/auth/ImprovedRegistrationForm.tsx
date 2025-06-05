
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Lock, FileText, Loader2 } from 'lucide-react';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { validatePasswordStrength, sanitizeInput, isValidEmail } from '@/utils/securityUtils';

interface ImprovedRegistrationFormProps {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  isLoading: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onDocumentTypeChange: (value: 'cpf' | 'cnpj') => void;
  onDocumentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ImprovedRegistrationForm: React.FC<ImprovedRegistrationFormProps> = ({
  name,
  email,
  password,
  confirmPassword,
  document,
  documentType,
  isLoading,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onDocumentTypeChange,
  onDocumentChange,
  onSubmit
}) => {
  const { isValid: isPasswordValid } = validatePasswordStrength(password);
  const isEmailValid = isValidEmail(email);
  
  const handleNameChange = (value: string) => {
    const sanitized = sanitizeInput(value, 100);
    onNameChange(sanitized);
  };
  
  const handleEmailChange = (value: string) => {
    const sanitized = sanitizeInput(value.toLowerCase(), 254);
    onEmailChange(sanitized);
  };
  
  const handlePasswordChange = (value: string) => {
    // Don't sanitize passwords as they might contain special characters intentionally
    onPasswordChange(value);
  };
  
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitize to only numbers
    const sanitized = e.target.value.replace(/[^\d]/g, '');
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: sanitized
      }
    };
    onDocumentChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced client-side validation
    if (!isPasswordValid) {
      return;
    }
    
    if (!isEmailValid) {
      return;
    }
    
    if (password !== confirmPassword) {
      return;
    }
    
    if (name.length < 2) {
      return;
    }
    
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Nome completo *
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            disabled={isLoading}
            className="pl-9"
            placeholder="Seu nome completo"
            maxLength={100}
            minLength={2}
          />
        </div>
        {name.length > 0 && name.length < 2 && (
          <p className="text-xs text-red-600">Nome deve ter pelo menos 2 caracteres</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email *
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            required
            disabled={isLoading}
            className={`pl-9 ${!isEmailValid && email ? 'border-red-300' : ''}`}
            placeholder="seu@email.com"
            maxLength={254}
          />
        </div>
        {!isEmailValid && email && (
          <p className="text-xs text-red-600">Formato de email inválido</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Senha *
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
            disabled={isLoading}
            className="pl-9"
            placeholder="Crie uma senha forte"
            maxLength={128}
          />
        </div>
        <PasswordStrengthIndicator password={password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirmar senha *
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            required
            disabled={isLoading}
            className={`pl-9 ${password && confirmPassword && password !== confirmPassword ? 'border-red-300' : ''}`}
            placeholder="Confirme sua senha"
            maxLength={128}
          />
        </div>
        {password && confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-red-600">As senhas não coincidem</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Tipo de documento *</Label>
        <Select value={documentType} onValueChange={onDocumentTypeChange} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cpf">CPF</SelectItem>
            <SelectItem value="cnpj">CNPJ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="document" className="text-sm font-medium">
          {documentType === 'cpf' ? 'CPF' : 'CNPJ'} *
        </Label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="document"
            type="text"
            value={document}
            onChange={handleDocumentChange}
            required
            disabled={isLoading}
            className="pl-9"
            placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
            maxLength={documentType === 'cpf' ? 14 : 18}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !isPasswordValid || !isEmailValid || password !== confirmPassword || name.length < 2}
        className="w-full bg-indexa-purple hover:bg-indexa-purple-dark text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando conta...
          </>
        ) : (
          'Criar conta'
        )}
      </Button>
    </form>
  );
};

export default ImprovedRegistrationForm;
