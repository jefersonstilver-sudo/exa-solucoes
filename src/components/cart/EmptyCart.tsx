
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const EmptyCart: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-[400px] text-center px-6"
    >
      <div className="bg-gray-100 rounded-full p-6 mb-4">
        <ShoppingCart className="h-10 w-10 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium text-[#3C1361] mb-2">Seu carrinho está vazio</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        Adicione painéis ao seu carrinho para iniciar sua campanha de mídia digital
      </p>
      <Button 
        variant="outline" 
        onClick={() => navigate('/paineis-digitais/loja')}
        className="border-[#3C1361] text-[#3C1361] hover:bg-[#3C1361] hover:text-white"
      >
        Explorar Painéis
      </Button>
    </motion.div>
  );
};

export default EmptyCart;
