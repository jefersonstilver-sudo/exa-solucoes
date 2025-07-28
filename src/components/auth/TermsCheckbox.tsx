import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { FileText, Shield } from 'lucide-react';

interface TermsCheckboxProps {
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  onTermsChange: (checked: boolean) => void;
  onPrivacyChange: (checked: boolean) => void;
  className?: string;
}

const TermsCheckbox: React.FC<TermsCheckboxProps> = ({
  acceptedTerms,
  acceptedPrivacy,
  onTermsChange,
  onPrivacyChange,
  className = ""
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-start space-x-3">
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onCheckedChange={onTermsChange}
          className="mt-1"
        />
        <Label 
          htmlFor="terms" 
          className="text-sm text-gray-700 cursor-pointer leading-relaxed"
        >
          <span className="flex items-center">
            <FileText className="h-4 w-4 mr-1.5 text-primary flex-shrink-0" />
            Li e aceito os{' '}
            <Link 
              to="/termos-uso" 
              target="_blank"
              className="text-primary hover:text-primary-dark underline mx-1 font-medium"
            >
              Termos de Uso
            </Link>
          </span>
        </Label>
      </div>
      
      <div className="flex items-start space-x-3">
        <Checkbox
          id="privacy"
          checked={acceptedPrivacy}
          onCheckedChange={onPrivacyChange}
          className="mt-1"
        />
        <Label 
          htmlFor="privacy" 
          className="text-sm text-gray-700 cursor-pointer leading-relaxed"
        >
          <span className="flex items-center">
            <Shield className="h-4 w-4 mr-1.5 text-primary flex-shrink-0" />
            Li e aceito a{' '}
            <Link 
              to="/politica-privacidade" 
              target="_blank"
              className="text-primary hover:text-primary-dark underline mx-1 font-medium"
            >
              Política de Privacidade
            </Link>
          </span>
        </Label>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        * O aceite é obrigatório para criar sua conta e acessar a plataforma
      </p>
    </div>
  );
};

export default TermsCheckbox;