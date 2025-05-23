
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const SuccessHeader: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.2
        }}
        className="flex justify-center mb-4"
      >
        <div className="bg-green-100 p-5 rounded-full">
          <CheckCircle className="h-14 w-14 text-green-600" />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Sua campanha está prestes a estrear
        </h1>
        <p className="text-gray-600 mt-3 text-lg">
          O próximo anúncio de sucesso começa agora. Envie seu vídeo abaixo para finalizar.
        </p>
      </motion.div>
    </div>
  );
};

export default SuccessHeader;
