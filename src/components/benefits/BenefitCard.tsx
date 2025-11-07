import React from 'react';
import { Button } from '@/components/ui/button';
import type { BenefitOption } from '@/types/providerBenefits';

interface BenefitCardProps {
  option: BenefitOption;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ option, onSelect, disabled = false }) => {
  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      {/* Gradiente de hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#DC2626]/0 via-[#DC2626]/0 to-[#DC2626]/0 group-hover:from-[#DC2626]/5 group-hover:via-[#DC2626]/10 group-hover:to-[#DC2626]/5 transition-all duration-300" />
      
      {/* Ring animado no hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#DC2626] to-[#991b1b] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
      
      <div className="relative bg-white rounded-2xl p-5 flex items-center gap-4 h-full">
        {/* Ícone com animação */}
        <div className="relative flex-shrink-0">
          <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
            {option.icon}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-lg text-gray-900 group-hover:text-[#DC2626] transition-colors duration-300 truncate">
            {option.name}
          </h3>
          {option.subtitle && (
            <p className="text-xs text-gray-600 font-medium truncate">
              {option.subtitle}
            </p>
          )}
        </div>

        {/* Button compacto */}
        <Button
          onClick={() => onSelect(option.id)}
          disabled={disabled}
          className="flex-shrink-0 bg-gradient-to-r from-[#DC2626] to-[#991b1b] hover:from-[#991b1b] hover:to-[#7f1d1d] text-white font-bold text-sm px-5 py-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Escolher
        </Button>
      </div>
    </div>
  );
};

export default BenefitCard;
