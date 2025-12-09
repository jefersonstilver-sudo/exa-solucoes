import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const AcessoNegadoPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="max-w-md w-full"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="mx-auto w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6"
          >
            <ShieldX className="w-10 h-10 text-[hsl(var(--exa-red))]" />
          </motion.div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acesso Restrito
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-8 text-sm leading-relaxed">
            Você não possui permissão para acessar este módulo. 
            Entre em contato com o administrador do sistema para solicitar acesso.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <Button
              onClick={() => navigate('/admin')}
              className="gap-2 bg-[hsl(var(--exa-red))] hover:bg-[hsl(var(--exa-red))]/90"
            >
              <Home className="w-4 h-4" />
              Ir para Dashboard
            </Button>
          </div>

          {/* Help text */}
          <p className="mt-8 text-xs text-gray-400">
            Código do erro: 403 - Acesso Proibido
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AcessoNegadoPage;
