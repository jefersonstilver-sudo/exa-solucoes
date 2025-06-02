
import React from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BuildingStoreGridEmptyProps {
  selectedLocation: { lat: number, lng: number } | null;
}

const BuildingStoreGridEmpty: React.FC<BuildingStoreGridEmptyProps> = ({ selectedLocation }) => {
  const isMobile = useIsMobile();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`text-center ${isMobile ? 'py-8' : 'py-16'}`}
    >
      <div className={`bg-white rounded-3xl shadow-xl border border-gray-100 max-w-2xl mx-auto ${
        isMobile ? 'p-6 mx-4' : 'p-12'
      }`}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={`bg-gradient-to-br from-[#3C1361]/10 to-[#4A1B6B]/10 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isMobile ? 'w-16 h-16' : 'w-24 h-24'
          }`}
        >
          <Building2 className={`text-[#3C1361] ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className={`font-bold text-gray-900 mb-4 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            {selectedLocation ? 'Nenhum prédio encontrado' : 'Nenhum prédio disponível'}
          </h3>
          <p className={`text-gray-600 leading-relaxed max-w-lg mx-auto ${
            isMobile ? 'text-sm' : 'text-lg'
          }`}>
            {selectedLocation 
              ? 'Tente expandir a área de busca ou explorar outras regiões.'
              : 'Nossa equipe está trabalhando para adicionar mais locais estratégicos.'
            }
          </p>
        </motion.div>

        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl ${isMobile ? 'text-sm' : ''}`}
          >
            <div className="flex items-center justify-center">
              <MapPin className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">
                Buscando próximo à sua localização
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BuildingStoreGridEmpty;
