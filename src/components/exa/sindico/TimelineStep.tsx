import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineStepProps {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
  isLast?: boolean;
}

const TimelineStep: React.FC<TimelineStepProps> = ({ 
  number, 
  icon: Icon, 
  title, 
  description, 
  isLast = false 
}) => {
  return (
    <div className="relative flex flex-col items-center">
      {/* Linha conectora (não mostrar no último) */}
      {!isLast && (
        <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-[#9C1E1E] to-[#180A0A] transform translate-x-1/2" />
      )}
      
      {/* Círculo do ícone */}
      <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-[#9C1E1E] to-[#180A0A] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
        <Icon className="w-12 h-12 text-white" />
        
        {/* Número */}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-exa-yellow rounded-full flex items-center justify-center text-sm font-bold text-exa-black shadow-md">
          {number}
        </div>
      </div>
      
      {/* Texto */}
      <div className="mt-6 text-center max-w-xs">
        <h3 className="font-montserrat font-semibold text-xl text-[#9C1E1E] mb-2">
          {title}
        </h3>
        <p className="font-poppins text-gray-600 text-sm">
          {description}
        </p>
      </div>
    </div>
  );
};

export default TimelineStep;
