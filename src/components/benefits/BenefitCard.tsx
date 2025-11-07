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
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-200">
      <div className="relative p-5 flex flex-col items-center text-center gap-3 min-h-[200px]">
        {/* Ícone GRANDE */}
        <div className="flex-shrink-0 my-1">
          <div className="text-6xl transition-transform duration-300 group-hover:scale-110">
            {option.icon}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 space-y-1">
          <h3 className="font-bold text-lg text-gray-900 leading-tight">
            {option.name}
          </h3>
          {option.subtitle && (
            <p className="text-xs text-gray-600">
              {option.subtitle}
            </p>
          )}
        </div>

        {/* Button */}
        <Button
          onClick={() => onSelect(option.id)}
          disabled={disabled}
          className="w-full bg-[#DC2626] hover:bg-[#991b1b] text-white font-bold text-sm px-4 py-5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Escolher
        </Button>
      </div>
    </div>
  );
};

export default BenefitCard;
