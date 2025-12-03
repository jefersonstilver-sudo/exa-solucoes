import React from 'react';
import BenefitMobileCard from './BenefitMobileCard';
import { ProviderBenefit, BenefitOption } from '@/types/providerBenefits';
import { Gift } from 'lucide-react';

interface BenefitMobileListProps {
  benefits: ProviderBenefit[];
  isLoading: boolean;
  onViewDetails: (benefit: ProviderBenefit) => void;
  onCopyLink: (benefit: ProviderBenefit) => void;
  onInsertCode: (benefit: ProviderBenefit) => void;
  benefitOptions: BenefitOption[];
}

const BenefitMobileList: React.FC<BenefitMobileListProps> = ({
  benefits,
  isLoading,
  onViewDetails,
  onCopyLink,
  onInsertCode,
  benefitOptions,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-card rounded-lg border shadow-sm overflow-hidden animate-pulse"
          >
            <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300" />
            <div className="p-3 space-y-2.5">
              <div className="h-8 bg-gray-200 rounded" />
              <div className="h-8 bg-gray-200 rounded" />
              <div className="h-8 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (benefits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
          <Gift className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Nenhum benefício encontrado
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Crie o primeiro benefício para seus prestadores clicando no botão acima.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-20">
      {benefits.map((benefit) => (
        <BenefitMobileCard
          key={benefit.id}
          benefit={benefit}
          onViewDetails={onViewDetails}
          onCopyLink={onCopyLink}
          onInsertCode={onInsertCode}
          benefitOptions={benefitOptions}
        />
      ))}
    </div>
  );
};

export default BenefitMobileList;
