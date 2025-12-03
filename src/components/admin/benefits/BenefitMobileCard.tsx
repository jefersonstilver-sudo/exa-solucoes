import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import BenefitStatusBadge from '@/components/benefits/BenefitStatusBadge';
import { Mail, MapPin, Gift, Eye, Link2, Code, ChevronDown, ChevronUp } from 'lucide-react';
import { ProviderBenefit, BenefitOption } from '@/types/providerBenefits';

interface BenefitMobileCardProps {
  benefit: ProviderBenefit;
  onViewDetails: (benefit: ProviderBenefit) => void;
  onCopyLink: (benefit: ProviderBenefit) => void;
  onInsertCode: (benefit: ProviderBenefit) => void;
  benefitOptions: BenefitOption[];
}

const BenefitMobileCard: React.FC<BenefitMobileCardProps> = ({
  benefit,
  onViewDetails,
  onCopyLink,
  onInsertCode,
  benefitOptions,
}) => {
  const requiresAction = benefit.benefit_choice && !benefit.gift_code && benefit.status !== 'cancelled';
  const isFinishedOrCancelled = benefit.status === 'cancelled' || benefit.status === 'code_sent';
  
  // Itens finalizados/cancelados começam retraídos, outros expandidos
  const [isExpanded, setIsExpanded] = useState(!isFinishedOrCancelled);
  
  const selectedBenefitOption = benefit.benefit_choice 
    ? benefitOptions.find(b => b.id === benefit.benefit_choice) 
    : null;

  // Versão planilha (retraída) para finalizados/cancelados - só nome + status
  if (isFinishedOrCancelled && !isExpanded) {
    return (
      <div 
        className="flex items-center justify-between px-3 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg cursor-pointer hover:bg-white/70 transition-colors"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {benefit.provider_name}
          </span>
        </div>
        <BenefitStatusBadge status={benefit.status} />
      </div>
    );
  }

  return (
    <div className={`bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl overflow-hidden shadow-sm ${
      requiresAction ? 'ring-1 ring-amber-300' : ''
    }`}>
      {/* Header compacto */}
      <div 
        className={`px-3 py-2 ${requiresAction ? 'bg-amber-500' : benefit.status === 'cancelled' ? 'bg-gray-400' : benefit.status === 'code_sent' ? 'bg-green-600' : 'bg-[#9C1E1E]'} ${isFinishedOrCancelled ? 'cursor-pointer' : ''}`}
        onClick={isFinishedOrCancelled ? () => setIsExpanded(false) : undefined}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {requiresAction && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </span>
            )}
            <span className="text-xs font-semibold text-white truncate">
              {benefit.provider_name}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <BenefitStatusBadge status={benefit.status} />
            {isFinishedOrCancelled && (
              <ChevronUp className="w-3.5 h-3.5 text-white/80" />
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo ultra-compacto */}
      <div className="p-2.5 space-y-1.5">
        {/* Email + Ponto inline */}
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1 text-muted-foreground truncate flex-1">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{benefit.provider_email}</span>
          </div>
          {benefit.activation_point && (
            <div className="flex items-center gap-0.5 text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded truncate max-w-[100px]">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate text-[10px]">{benefit.activation_point}</span>
            </div>
          )}
        </div>

        {/* Presente escolhido */}
        {benefit.benefit_choice && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Gift className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
                {selectedBenefitOption?.name || benefit.benefit_choice}
              </span>
            </div>
            {requiresAction && (
              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold animate-pulse">
                CÓDIGO!
              </span>
            )}
          </div>
        )}

        {/* Badges de email */}
        {(benefit.invitation_sent_at || benefit.final_email_sent_at) && (
          <div className="flex items-center gap-1 flex-wrap">
            {benefit.invitation_sent_at && (
              <span className="inline-flex items-center gap-0.5 text-[8px] bg-green-50 text-green-700 border border-green-200 px-1 py-0.5 rounded">
                ✓ Convite
              </span>
            )}
            {benefit.final_email_sent_at && (
              <span className="inline-flex items-center gap-0.5 text-[8px] bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.5 rounded">
                ✓ Código
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ações compactas */}
      <div className="px-2.5 pb-2.5 flex gap-1.5">
        <Button
          onClick={() => onViewDetails(benefit)}
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-[11px] font-medium"
        >
          <Eye className="w-3 h-3 mr-1" />
          Ver
        </Button>
        <Button
          onClick={() => onCopyLink(benefit)}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Link2 className="w-3.5 h-3.5" />
        </Button>
        {benefit.status !== 'cancelled' && !benefit.gift_code && (
          <Button
            onClick={() => onInsertCode(benefit)}
            size="sm"
            className={`h-8 px-2.5 text-[11px] font-medium text-white ${
              requiresAction 
                ? 'bg-amber-500 hover:bg-amber-600' 
                : 'bg-[#9C1E1E] hover:bg-[#7D1818]'
            }`}
          >
            <Code className="w-3 h-3 mr-1" />
            Código
          </Button>
        )}
      </div>
    </div>
  );
};

export default BenefitMobileCard;
