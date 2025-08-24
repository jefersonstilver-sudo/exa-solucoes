
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import RegistrationHeader from './RegistrationHeader';
import ImprovedRegistrationForm from './ImprovedRegistrationForm';
import ErrorDisplay from './ErrorDisplay';

interface RegistrationContainerProps {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  document: string;
  documentType: 'cpf' | 'documento_estrangeiro';
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  isLoading: boolean;
  error: string | null;
  redirectPath: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onDocumentTypeChange: (type: 'cpf' | 'documento_estrangeiro') => void;
  onDocumentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTermsChange: (checked: boolean) => void;
  onPrivacyChange: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const RegistrationContainer: React.FC<RegistrationContainerProps> = ({
  name,
  email,
  password,
  confirmPassword,
  document,
  documentType,
  acceptedTerms,
  acceptedPrivacy,
  isLoading,
  error,
  redirectPath,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onDocumentTypeChange,
  onDocumentChange,
  onTermsChange,
  onPrivacyChange,
  onSubmit
}) => {
  return (
    <div className="w-full max-w-md">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <RegistrationHeader />
          
          <CardContent className="p-6">
            {error && <ErrorDisplay error={error} />}
            
            <ImprovedRegistrationForm
              name={name}
              email={email}
              password={password}
              confirmPassword={confirmPassword}
              document={document}
              documentType={documentType}
              acceptedTerms={acceptedTerms}
              acceptedPrivacy={acceptedPrivacy}
              isLoading={isLoading}
              onNameChange={onNameChange}
              onEmailChange={onEmailChange}
              onPasswordChange={onPasswordChange}
              onConfirmPasswordChange={onConfirmPasswordChange}
              onDocumentTypeChange={onDocumentTypeChange}
              onDocumentChange={onDocumentChange}
              onTermsChange={onTermsChange}
              onPrivacyChange={onPrivacyChange}
              onSubmit={onSubmit}
            />
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 p-6 pt-0">
            <div className="text-center text-sm">
              <span className="text-gray-600">Já tem uma conta?</span>{' '}
              <Link 
                to={`/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                className="font-medium text-indexa-purple hover:text-indexa-purple-dark hover:underline transition-colors"
              >
                Faça login
              </Link>
            </div>
            
            <div className="text-center text-xs text-gray-500 px-2">
              <p>
                Ao criar uma conta, você concorda com os nossos{' '}
                <a href="#" className="underline hover:text-indexa-purple transition-colors">
                  termos de uso
                </a>{' '}
                e{' '}
                <a href="#" className="underline hover:text-indexa-purple transition-colors">
                  política de privacidade
                </a>.
              </p>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegistrationContainer;
