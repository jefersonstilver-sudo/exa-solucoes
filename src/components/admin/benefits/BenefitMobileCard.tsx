import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BenefitStatusBadge from '@/components/benefits/BenefitStatusBadge';
import { Mail, MapPin, Gift, Calendar, Eye, Link2, Code } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  const selectedBenefitOption = benefit.benefit_choice 
    ? benefitOptions.find(b => b.id === benefit.benefit_choice) 
    : null;
  const deliveryTime = selectedBenefitOption?.delivery_days === 1 
    ? 'em até 24 horas' 
    : `em até ${selectedBenefitOption?.delivery_days || 3} dias`;

  return (
    <Card className={`border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
      requiresAction ? 'border-l-2 border-l-amber-500' : ''
    }`}>
      {/* Header - Minimalista */}
      <div className={`px-3 py-2.5 ${requiresAction ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-[#9C1E1E] to-[#DC2626]'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {requiresAction && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            )}
            <h3 className="text-sm font-semibold text-white truncate">
              {benefit.provider_name}
            </h3>
          </div>
          <BenefitStatusBadge status={benefit.status} />
        </div>
        {requiresAction && (
          <div className="mt-1.5 inline-flex items-center gap-1 bg-white/15 rounded px-2 py-0.5">
            <span className="text-white font-semibold text-[10px]">⚡ AÇÃO NECESSÁRIA</span>
          </div>
        )}
      </div>

      {/* Conteúdo - Compacto */}
      <div className={`p-3 space-y-2.5 ${requiresAction ? 'bg-amber-50/30' : ''}`}>
        {/* Email */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Email</p>
            <p className="text-xs font-medium text-foreground truncate">{benefit.provider_email}</p>
          </div>
        </div>

        {/* Ponto de Ativação */}
        {benefit.activation_point && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Ponto de Ativação</p>
              <p className="text-xs font-medium text-foreground truncate">{benefit.activation_point}</p>
            </div>
          </div>
        )}

        {/* Presente Escolhido */}
        {benefit.benefit_choice && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
              <Gift className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Presente Escolhido</p>
              <p className="text-xs font-semibold text-foreground truncate">{selectedBenefitOption?.name || benefit.benefit_choice}</p>
              {requiresAction && (
                <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                  ⚡ Entrega {deliveryTime}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Data de Criação */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Criado em</p>
            <p className="text-xs font-medium text-foreground">
              {format(new Date(benefit.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Botões de Ação - Otimizados */}
      <div className={`p-2.5 border-t space-y-1.5 ${requiresAction ? 'bg-amber-50/30' : 'bg-muted/20'}`}>
        <Button
          onClick={() => onViewDetails(benefit)}
          variant="outline"
          size="sm"
          className="w-full h-9 text-xs font-medium"
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          Ver Detalhes
        </Button>
        
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            onClick={() => onCopyLink(benefit)}
            variant="secondary"
            size="sm"
            className="h-9 text-xs font-medium"
          >
            <Link2 className="w-3.5 h-3.5 mr-1" />
            Copiar Link
          </Button>
          
          {benefit.status !== 'cancelled' && !benefit.gift_code && (
            <Button
              onClick={() => onInsertCode(benefit)}
              size="sm"
              className={`h-9 text-xs font-medium text-white ${
                requiresAction 
                  ? 'bg-amber-500 hover:bg-amber-600 animate-pulse' 
                  : 'bg-[#9C1E1E] hover:bg-[#7D1818]'
              }`}
            >
              <Code className="w-3.5 h-3.5 mr-1" />
              Inserir Código
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BenefitMobileCard;
