
import React from 'react';
import { Building2, MapPin, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import LaunchCountdown from './LaunchCountdown';

const BuildingStoreHeader = () => {
  const isMobile = useIsMobile();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`text-center ${isMobile ? 'py-8 px-4' : 'py-16 px-8'}`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header centralizado */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={`bg-gradient-to-br from-[#3C1361]/10 to-[#4A1B6B]/10 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isMobile ? 'w-16 h-16' : 'w-20 h-20'
            }`}
          >
            <Building2 className={`text-[#3C1361] ${isMobile ? 'h-8 w-8' : 'h-10 w-10'}`} />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`font-bold text-gray-900 mb-4 ${
              isMobile ? 'text-2xl' : 'text-4xl lg:text-5xl'
            }`}
          >
            Loja de Prédios
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`text-gray-600 leading-relaxed max-w-2xl mx-auto ${
              isMobile ? 'text-base' : 'text-lg'
            }`}
          >
            Encontre o local perfeito para sua campanha publicitária. 
            Explore nossos prédios em localizações estratégicas da cidade.
          </motion.p>
          
          {/* Contador Regressivo */}
          <LaunchCountdown />
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-8'} max-w-2xl mx-auto`}
        >
          <div className={`flex items-center ${isMobile ? 'justify-center' : 'justify-end'} text-[#3C1361]`}>
            <MapPin className="h-5 w-5 mr-2" />
            <span className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
              Localizações Premium
            </span>
          </div>
          <div className={`flex items-center ${isMobile ? 'justify-center' : 'justify-start'} text-[#3C1361]`}>
            <Search className="h-5 w-5 mr-2" />
            <span className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
              Busca por Região
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BuildingStoreHeader;
