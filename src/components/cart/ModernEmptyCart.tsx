
import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ModernEmptyCart: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToStore = () => {
    navigate('/paineis-digitais/loja');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-br from-gray-50 to-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md mx-auto"
      >
        {/* Ícone animado */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="relative mb-8"
        >
          <div className="bg-gradient-to-br from-[#3C1361] to-[#4A1A6B] p-6 rounded-full inline-block">
            <ShoppingCart className="h-12 w-12 text-white" />
          </div>
          
          {/* Círculos decorativos */}
          <motion.div
            className="absolute inset-0 border-2 border-[#00D4AA]/30 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Texto principal */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Seu carrinho está vazio
        </h2>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Explore nossa seleção premium de painéis digitais e encontre a 
          localização perfeita para sua campanha publicitária.
        </p>

        {/* Botão de ação */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={handleBackToStore}
            className="bg-gradient-to-r from-[#3C1361] to-[#4A1A6B] hover:from-[#4A1A6B] hover:to-[#3C1361] text-white px-8 py-3 rounded-full font-semibold shadow-lg transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Explorar Painéis
          </Button>
        </motion.div>

        {/* Características em destaque */}
        <div className="mt-12 grid grid-cols-1 gap-4 text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-[#00D4AA] rounded-full"></div>
            <span>Painéis em localizações premium</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-[#00D4AA] rounded-full"></div>
            <span>Tecnologia digital de alta qualidade</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-[#00D4AA] rounded-full"></div>
            <span>Relatórios detalhados de performance</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModernEmptyCart;
