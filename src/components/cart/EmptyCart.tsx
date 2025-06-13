
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
      className="flex flex-col items-center justify-center h-[400px] text-center px-6 py-10"
    >
      <motion.div 
        className="bg-gradient-to-b from-[#3C1361]/10 to-[#3C1361]/5 rounded-full p-8 mb-6"
        initial={{ y: 0 }}
        animate={{ y: [0, -10, 0] }}
        transition={{ 
          repeat: Infinity, 
          duration: 3,
          ease: "easeInOut"
        }}
      >
        <ShoppingCart className="h-12 w-12 text-[#3C1361]/50" aria-hidden="true" />
      </motion.div>
      
      <h3 className="text-xl font-bold text-[#3C1361] mb-3">
        Seu carrinho está vazio
      </h3>
      
      <p className="text-sm text-gray-600 mb-8 max-w-xs leading-relaxed">
        Adicione painéis ao seu carrinho para iniciar sua campanha de mídia digital e alcançar milhares de pessoas
      </p>
      
      <Button 
        variant="outline" 
        onClick={() => navigate('/loja')}
        className="border-[#3C1361] text-[#3C1361] hover:bg-[#3C1361] hover:text-white transition-colors px-8"
      >
        Explorar Painéis
      </Button>
    </motion.div>
  );
};

export default EmptyCart;
