
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Key, UserCheck, ArrowRight, Eye, EyeOff, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import DocumentInput from './DocumentInput';

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
  onDocumentTypeChange: (type: 'cpf' | 'cnpj') => void;
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validações de senha
  const passwordValidation = {
    length: password.length >= 6,
    match: password === confirmPassword && password.length > 0,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const passwordStrength = Object.values(passwordValidation).filter(Boolean).length;
  const strengthColor = passwordStrength <= 2 ? 'text-red-500' : passwordStrength <= 3 ? 'text-yellow-500' : 'text-green-500';
  const strengthText = passwordStrength <= 2 ? 'Fraca' : passwordStrength <= 3 ? 'Média' : 'Forte';

  const isFormValid = name.length > 0 && email.length > 0 && passwordValidation.length && passwordValidation.match && document.length > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center text-gray-900">
          <UserCheck className="h-4 w-4 mr-2 text-indexa-purple" /> Nome completo
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
          className="border-indexa-purple/20 focus:border-indexa-purple h-11 text-gray-900 placeholder-gray-500"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center text-gray-900">
          <Mail className="h-4 w-4 mr-2 text-indexa-purple" /> Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          className="border-indexa-purple/20 focus:border-indexa-purple h-11 text-gray-900 placeholder-gray-500"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center text-gray-900">
          <Key className="h-4 w-4 mr-2 text-indexa-purple" /> Senha
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            className="border-indexa-purple/20 focus:border-indexa-purple h-11 text-gray-900 placeholder-gray-500 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {password.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Força da senha:</span>
              <span className={`text-xs font-medium ${strengthColor}`}>{strengthText}</span>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded ${
                    passwordStrength >= level ? 
                    (passwordStrength <= 2 ? 'bg-red-500' : passwordStrength <= 3 ? 'bg-yellow-500' : 'bg-green-500') : 
                    'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="space-y-1">
              <div className={`flex items-center text-xs ${passwordValidation.length ? 'text-green-600' : 'text-gray-400'}`}>
                {passwordValidation.length ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                Pelo menos 6 caracteres
              </div>
              <div className={`flex items-center text-xs ${passwordValidation.hasUpper && passwordValidation.hasLower ? 'text-green-600' : 'text-gray-400'}`}>
                {passwordValidation.hasUpper && passwordValidation.hasLower ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                Letras maiúsculas e minúsculas
              </div>
              <div className={`flex items-center text-xs ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                {passwordValidation.hasNumber ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                Pelo menos um número
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="flex items-center text-gray-900">
          <Key className="h-4 w-4 mr-2 text-indexa-purple" /> Confirmar senha
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            required
            className={`h-11 text-gray-900 placeholder-gray-500 pr-10 ${
              confirmPassword.length > 0 ? 
              (passwordValidation.match ? 'border-green-500 focus:border-green-500' : 'border-red-500 focus:border-red-500') :
              'border-indexa-purple/20 focus:border-indexa-purple'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {confirmPassword.length > 0 && (
          <div className={`flex items-center text-xs ${passwordValidation.match ? 'text-green-600' : 'text-red-600'}`}>
            {passwordValidation.match ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
            {passwordValidation.match ? 'As senhas coincidem' : 'As senhas não coincidem'}
          </div>
        )}
      </div>
      
      <DocumentInput
        documentType={documentType}
        document={document}
        onDocumentTypeChange={onDocumentTypeChange}
        onDocumentChange={onDocumentChange}
      />

      {/* Informação sobre confirmação de email */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Mail className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Confirmação por email necessária
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Após criar sua conta, você receberá um email para confirmar seu endereço. 
              Verifique sua caixa de entrada e clique no link de confirmação para ativar sua conta.
            </p>
          </div>
        </div>
      </div>
      
      <motion.div
        whileHover={{ scale: isFormValid ? 1.02 : 1 }}
        whileTap={{ scale: isFormValid ? 0.98 : 1 }}
        className="pt-2"
      >
        <Button 
          type="submit" 
          className={`w-full transition-all duration-200 h-11 ${
            isFormValid 
              ? 'bg-indexa-purple hover:bg-indexa-purple-dark' 
              : 'bg-gray-300 cursor-not-allowed'
          }`}
          disabled={isLoading || !isFormValid}
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Criando conta...
            </>
          ) : (
            <>
              Criar conta <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
};

export default ImprovedRegistrationForm;
