import React from 'react';
import BenefitMobileCard from './BenefitMobileCard';
import { ProviderBenefit } from '@/types/providerBenefits';
import { Gift } from 'lucide-react';

interface BenefitMobileListProps {
  benefits: ProviderBenefit[];
  isLoading: boolean;
  onViewDetails: (benefit: ProviderBenefit) => void;
  onCopyLink: (benefit: ProviderBenefit) => void;
  onInsertCode: (benefit: ProviderBenefit) => void;
}

const BenefitMobileList: React.FC<BenefitMobileListProps> = ({
  benefits,
  isLoading,
  onViewDetails,
  onCopyLink,
  onInsertCode,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-border shadow-md overflow-hidden animate-pulse"
          >
            <div className="h-20 bg-gradient-to-r from-gray-200 to-gray-300" />
            <div className="p-4 space-y-4">
              <div className="h-12 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (benefits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Gift className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          Nenhum benefício encontrado
        </h3>
        <p className="text-base text-muted-foreground max-w-sm">
          Crie o primeiro benefício para seus prestadores clicando no botão acima.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {benefits.map((benefit) => (
        <BenefitMobileCard
          key={benefit.id}
          benefit={benefit}
          onViewDetails={onViewDetails}
          onCopyLink={onCopyLink}
          onInsertCode={onInsertCode}
        />
      ))}
    </div>
  );
};

export default BenefitMobileList;
