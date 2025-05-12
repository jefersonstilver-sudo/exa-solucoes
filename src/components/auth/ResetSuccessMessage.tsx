
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResetSuccessMessageProps {
  email: string;
  onBackToLogin: () => void;
}

export const ResetSuccessMessage = ({ email, onBackToLogin }: ResetSuccessMessageProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-green-50 border border-green-200 rounded-md p-4 text-center"
    >
      <div className="bg-green-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
        <Mail className="h-6 w-6 text-green-600" />
      </div>
      <h3 className="text-lg font-medium text-green-800 mb-1">Email enviado!</h3>
      <p className="text-sm text-green-700 mb-4">
        Enviamos instruções para redefinir sua senha para {email}.
        Verifique sua caixa de entrada e spam.
      </p>
      <Button 
        type="button" 
        variant="outline" 
        onClick={onBackToLogin}
        className="mt-2"
      >
        Voltar ao login
      </Button>
    </motion.div>
  );
};
