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
    <div className="group relative bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(220,38,38,0.5)] transition-all duration-500 hover:-translate-y-3 border-2 border-gray-200 hover:border-[#DC2626]">
      {/* Gradiente de hover animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#DC2626]/0 via-[#DC2626]/0 to-[#DC2626]/0 group-hover:from-[#DC2626]/5 group-hover:via-[#DC2626]/15 group-hover:to-[#DC2626]/5 transition-all duration-500" />
      
      {/* Ring animado no hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#DC2626] via-[#FF6B6B] to-[#991b1b] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg" />
      
      <div className="relative bg-white rounded-3xl p-8 flex flex-col items-center text-center gap-5 h-full min-h-[320px]">
        {/* Ícone GRANDE com animação forte */}
        <div className="relative flex-shrink-0 my-2">
          <div className="text-8xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 drop-shadow-2xl animate-bounce" style={{ animationDuration: '2s' }}>
            {option.icon}
          </div>
          {/* Brilho atrás do ícone */}
          <div className="absolute inset-0 bg-gradient-radial from-[#DC2626]/30 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 space-y-2">
          <h3 className="font-black text-2xl text-gray-900 group-hover:text-[#DC2626] transition-colors duration-300 leading-tight">
            {option.name}
          </h3>
          {option.subtitle && (
            <p className="text-sm text-gray-600 font-semibold">
              {option.subtitle}
            </p>
          )}
        </div>

        {/* Button grande e impactante */}
        <Button
          onClick={() => onSelect(option.id)}
          disabled={disabled}
          className="w-full bg-gradient-to-r from-[#DC2626] to-[#991b1b] hover:from-[#991b1b] hover:to-[#7f1d1d] text-white font-black text-lg px-8 py-7 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Escolher
        </Button>
      </div>
    </div>
  );
};

export default BenefitCard;
