
import React from 'react';
import { Clock } from 'lucide-react';

interface PlanHeaderProps {
  title?: string;
  subtitle?: string;
}

const PlanHeader: React.FC<PlanHeaderProps> = ({ 
  title = "Escolha seu plano ideal de veiculação",
  subtitle = "Ganhe vídeos, economize por mês e destaque sua campanha nos melhores locais!"
}) => {
  return (
    <>
      <div className="flex items-center gap-2 mb-6 text-xl font-medium text-gray-700">
        <Clock className="h-6 w-6 text-indexa-purple" />
        <span>{title}</span>
      </div>
      
      <p className="text-lg text-gray-600 mb-8">
        {subtitle}
      </p>
    </>
  );
};

export default PlanHeader;
