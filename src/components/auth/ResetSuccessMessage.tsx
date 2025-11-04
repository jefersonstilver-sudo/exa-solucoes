
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
      className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 text-center shadow-lg"
    >
      <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
        <Mail className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-green-800 mb-2">Email Enviado com Sucesso!</h3>
      <p className="text-sm text-green-700 mb-2">
        Enviamos instruções para redefinir sua senha para:
      </p>
      <p className="text-base font-semibold text-green-900 mb-4">{email}</p>
      <p className="text-xs text-green-600 mb-4">
        Verifique sua caixa de entrada e também a pasta de spam. O email vem de <strong>noreply@examidia.com.br</strong>
      </p>
      <Button 
        type="button" 
        variant="outline" 
        onClick={onBackToLogin}
        className="mt-2 border-green-300 text-green-700 hover:bg-green-50"
      >
        Voltar ao login
      </Button>
    </motion.div>
  );
};
