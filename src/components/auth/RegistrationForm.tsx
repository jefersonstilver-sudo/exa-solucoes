
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Key, UserCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import DocumentInput from './DocumentInput';

interface RegistrationFormProps {
  name: string;
  email: string;
  password: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  isLoading: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onDocumentTypeChange: (type: 'cpf' | 'cnpj') => void;
  onDocumentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  name,
  email,
  password,
  document,
  documentType,
  isLoading,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onDocumentTypeChange,
  onDocumentChange,
  onSubmit
}) => {
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
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
          className="border-indexa-purple/20 focus:border-indexa-purple h-11 text-gray-900 placeholder-gray-500"
        />
        <p className="text-xs text-gray-600">
          A senha deve ter pelo menos 6 caracteres
        </p>
      </div>
      
      <DocumentInput
        documentType={documentType}
        document={document}
        onDocumentTypeChange={onDocumentTypeChange}
        onDocumentChange={onDocumentChange}
      />
      
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="pt-2"
      >
        <Button 
          type="submit" 
          className="w-full bg-indexa-purple hover:bg-indexa-purple-dark transition-all duration-200 h-11"
          disabled={isLoading}
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

export default RegistrationForm;
