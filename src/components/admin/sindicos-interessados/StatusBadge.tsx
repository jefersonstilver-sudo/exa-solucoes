
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const badgeProps = {
    'novo': { variant: 'default' as const, className: 'bg-blue-500 text-white' },
    'contatado': { variant: 'secondary' as const, className: '' },
    'interessado': { variant: 'default' as const, className: 'bg-green-500 text-white' },
    'nao_interessado': { variant: 'destructive' as const, className: '' },
    'instalado': { variant: 'default' as const, className: 'bg-emerald-500 text-white' }
  };

  const labels = {
    'novo': 'Novo',
    'contatado': 'Contatado',
    'interessado': 'Interessado', 
    'nao_interessado': 'Não Interessado',
    'instalado': 'Instalado'
  };

  const props = badgeProps[status as keyof typeof badgeProps] || { variant: 'default' as const, className: '' };
  const label = labels[status as keyof typeof labels] || status;

  return (
    <Badge variant={props.variant} className={props.className}>
      {label}
    </Badge>
  );
};

export default StatusBadge;
