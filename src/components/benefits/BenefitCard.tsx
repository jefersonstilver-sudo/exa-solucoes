import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BenefitOption } from '@/types/providerBenefits';

interface BenefitCardProps {
  option: BenefitOption;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ option, onSelect, disabled = false }) => {
  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary">
      <div className="p-6 flex flex-col items-center text-center space-y-4">
        {/* Icon */}
        <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
          {option.icon}
        </div>

        {/* Name */}
        <h3 className="font-bold text-lg text-foreground">
          {option.name}
        </h3>

        {/* Subtitle */}
        {option.subtitle && (
          <p className="text-sm text-muted-foreground">
            {option.subtitle}
          </p>
        )}

        {/* Button */}
        <Button
          onClick={() => onSelect(option.id)}
          disabled={disabled}
          className="w-full mt-2"
          variant="default"
        >
          Selecionar
        </Button>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Card>
  );
};

export default BenefitCard;
