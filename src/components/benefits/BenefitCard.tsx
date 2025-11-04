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
    <div className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">
      {/* Gradiente de hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#DC2626]/0 via-[#DC2626]/0 to-[#DC2626]/0 group-hover:from-[#DC2626]/5 group-hover:via-[#DC2626]/10 group-hover:to-[#DC2626]/5 transition-all duration-500" />
      
      {/* Ring animado no hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#DC2626] to-[#991b1b] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      
      <div className="relative bg-white rounded-3xl p-8 flex flex-col items-center text-center space-y-6 h-full">
        {/* Ícone com animação */}
        <div className="relative">
          <div className="text-7xl group-hover:scale-125 transition-transform duration-500 group-hover:rotate-12">
            {option.icon}
          </div>
          <div className="absolute inset-0 bg-[#DC2626]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Nome */}
        <div className="flex-1 space-y-2">
          <h3 className="font-black text-xl text-gray-900 group-hover:text-[#DC2626] transition-colors duration-300">
            {option.name}
          </h3>

          {/* Subtitle */}
          {option.subtitle && (
            <p className="text-sm text-gray-600 font-medium">
              {option.subtitle}
            </p>
          )}
        </div>

        {/* Button com estilo iFood */}
        <Button
          onClick={() => onSelect(option.id)}
          disabled={disabled}
          className="w-full bg-gradient-to-r from-[#DC2626] to-[#991b1b] hover:from-[#991b1b] hover:to-[#7f1d1d] text-white font-bold text-base py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Selecionar
        </Button>
      </div>
    </div>
  );
};

export default BenefitCard;
