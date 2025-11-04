import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BenefitStatusBadge from '@/components/benefits/BenefitStatusBadge';
import { Mail, MapPin, Gift, Calendar, Eye, Link2, Code } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProviderBenefit } from '@/types/providerBenefits';

interface BenefitMobileCardProps {
  benefit: ProviderBenefit;
  onViewDetails: (benefit: ProviderBenefit) => void;
  onCopyLink: (benefit: ProviderBenefit) => void;
  onInsertCode: (benefit: ProviderBenefit) => void;
}

const BenefitMobileCard: React.FC<BenefitMobileCardProps> = ({
  benefit,
  onViewDetails,
  onCopyLink,
  onInsertCode,
}) => {
  return (
    <Card className="bg-white border border-border shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] overflow-hidden">
      {/* Header com gradiente EXA */}
      <div className="bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-white leading-tight flex-1">
            {benefit.provider_name}
          </h3>
          <BenefitStatusBadge status={benefit.status} />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-4 bg-background">
        {/* Email */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Mail className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
            <p className="text-base font-medium text-foreground truncate">{benefit.provider_email}</p>
          </div>
        </div>

        {/* Ponto de Ativação */}
        {benefit.activation_point && (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ponto de Ativação</p>
              <p className="text-base font-medium text-foreground">{benefit.activation_point}</p>
            </div>
          </div>
        )}

        {/* Presente Escolhido */}
        {benefit.benefit_choice && (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Gift className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Presente Escolhido</p>
              <p className="text-base font-medium text-foreground">{benefit.benefit_choice}</p>
            </div>
          </div>
        )}

        {/* Data de Criação */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Criado em</p>
            <p className="text-base font-medium text-foreground">
              {format(new Date(benefit.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="p-4 bg-muted/30 border-t border-border space-y-2">
        <Button
          onClick={() => onViewDetails(benefit)}
          variant="outline"
          className="w-full h-12 text-base font-medium"
        >
          <Eye className="w-5 h-5 mr-2" />
          Ver Detalhes
        </Button>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => onCopyLink(benefit)}
            variant="secondary"
            className="h-12 text-sm font-medium"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Copiar Link
          </Button>
          
          {benefit.status !== 'cancelled' && !benefit.gift_code && (
            <Button
              onClick={() => onInsertCode(benefit)}
              className="h-12 text-sm font-medium bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
            >
              <Code className="w-4 h-4 mr-2" />
              Inserir Código
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BenefitMobileCard;
