import React from 'react';
import { cn } from '@/lib/utils';
import { useActiveBuildingNames } from '@/hooks/useActiveBuildingNames';

interface CondominiösTickerProps {
  className?: string;
}

const CondominiosTicker: React.FC<CondominiösTickerProps> = ({ className }) => {
  const { buildingNames, loading } = useActiveBuildingNames();

  if (loading || buildingNames.length === 0) {
    return null;
  }

  // Duplicar array para ticker infinito
  const duplicatedCondominios = [...buildingNames, ...buildingNames];

  return (
    <div className={cn('relative overflow-hidden bg-[#9C1E1E] py-6', className)}>
      {/* Faixa de destaque com gradiente */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#9C1E1E] via-[#D72638] to-[#9C1E1E] opacity-90" />
      
      {/* Brilho superior */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      <div className="relative flex animate-scroll-left whitespace-nowrap">
        {duplicatedCondominios.map((condominio, index) => (
          <div
            key={index}
            className="inline-flex items-center mx-12 font-poppins text-white font-semibold text-base drop-shadow-lg"
          >
            <span className="text-white mr-3 text-lg drop-shadow-md">●</span>
            {condominio}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CondominiosTicker;
