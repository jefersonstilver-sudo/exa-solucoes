import React from 'react';
import { Badge } from '@/components/ui/badge';

interface BenefitStatusBadgeProps {
  status: 'pending' | 'choice_made' | 'code_sent' | 'cancelled';
}

const BenefitStatusBadge: React.FC<BenefitStatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    pending: {
      label: 'Aguardando escolha',
      variant: 'secondary' as const,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    choice_made: {
      label: 'Escolha feita',
      variant: 'default' as const,
      className: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    code_sent: {
      label: 'Código enviado',
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 border-green-300',
    },
    cancelled: {
      label: 'Cancelado',
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 border-red-300',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};

export default BenefitStatusBadge;
