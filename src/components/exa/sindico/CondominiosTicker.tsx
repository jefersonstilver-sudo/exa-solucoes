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
    <div className={cn('relative overflow-hidden bg-[#9C1E1E]/20 backdrop-blur-md py-6 border-t border-[#9C1E1E]/30', className)}>
      <div className="flex animate-scroll-left whitespace-nowrap">
        {duplicatedCondominios.map((condominio, index) => (
          <div
            key={index}
            className="inline-flex items-center mx-12 font-poppins text-white font-medium text-base"
          >
            <span className="text-exa-yellow mr-3 text-lg">●</span>
            {condominio}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CondominiosTicker;
