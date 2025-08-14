import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileText, Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface NewTermsCheckboxProps {
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  onTermsChange: (checked: boolean) => void;
  onPrivacyChange: (checked: boolean) => void;
  hasReadTermsCompletely: boolean;
  hasReadPrivacyCompletely: boolean;
  className?: string;
}

const NewTermsCheckbox: React.FC<NewTermsCheckboxProps> = ({
  acceptedTerms,
  acceptedPrivacy,
  onTermsChange,
  onPrivacyChange,
  hasReadTermsCompletely,
  hasReadPrivacyCompletely,
  className = ""
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Termos de Uso */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={onTermsChange}
            disabled={!hasReadTermsCompletely}
            className="mt-1"
          />
          <Label 
            htmlFor="terms" 
            className={`text-sm cursor-pointer leading-relaxed transition-colors ${
              !hasReadTermsCompletely ? 'text-gray-400' : 'text-gray-700'
            }`}
          >
            <span className="flex items-center flex-wrap">
              <FileText className="h-4 w-4 mr-1.5 text-primary flex-shrink-0" />
              <span>Li na íntegra e aceito os </span>
              <span className="font-semibold text-primary mx-1">Termos de Uso</span>
              {hasReadTermsCompletely && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-2"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </motion.span>
              )}
            </span>
          </Label>
        </div>
        
        {!hasReadTermsCompletely && (
          <p className="text-xs text-orange-600 ml-7 italic">
            * Você precisa ler os termos completamente antes de aceitar
          </p>
        )}
      </motion.div>

      {/* Política de Privacidade */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
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
              <span>Li e aceito a </span>
              <span className="font-semibold text-primary mx-1">Política de Privacidade</span>
            </span>
          </Label>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4"
      >
        <p className="text-xs text-blue-700 font-medium">
          📋 Segurança Jurídica
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Ao criar sua conta, registramos que você leu na íntegra e aceitou nossos termos e políticas, 
          conforme exigido pela legislação brasileira.
        </p>
      </motion.div>
    </div>
  );
};

export default NewTermsCheckbox;