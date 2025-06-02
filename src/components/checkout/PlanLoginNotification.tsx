
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UserX, ArrowRight } from 'lucide-react';

const PlanLoginNotification = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border p-8 text-center max-w-md w-full"
      >
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
          <UserX className="w-8 h-8 text-red-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Login Necessário
        </h2>
        
        <p className="text-gray-600 mb-6">
          Você precisa estar logado para continuar com a seleção do plano.
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/login?redirect=/checkout/plano')}
            className="w-full bg-[#3C1361] hover:bg-[#3C1361]/90 text-white"
          >
            Fazer Login
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Voltar ao Início
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PlanLoginNotification;
