
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ReasonCardProps {
  icon: LucideIcon;
  title: string;
  number: string;
  description: string;
  detail: string;
  isActive: boolean;
  index: number;
  isVisible: boolean;
  onClick: () => void;
}

const ReasonCard: React.FC<ReasonCardProps> = ({
  icon: IconComponent,
  title,
  number,
  description,
  detail,
  isActive,
  index,
  isVisible,
  onClick
}) => {
  return (
    <div
      className={`transform transition-all duration-500 cursor-pointer ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${isActive ? 'scale-105' : 'hover:scale-102'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
      onClick={onClick}
    >
      <div className={`relative bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${
        isActive 
          ? 'border-indexa-mint/60 shadow-lg shadow-indexa-mint/20' 
          : 'border-white/10 hover:border-indexa-mint/30'
      }`}>
        
        <div className={`text-center mb-4 sm:mb-6 transition-all duration-300 ${
          isActive ? 'scale-110' : 'scale-100'
        }`}>
          <div className={`text-4xl sm:text-5xl font-bold mb-2 transition-colors duration-300 ${
            isActive ? 'text-indexa-mint' : 'text-white'
          }`}>
            {number}
          </div>
          
          <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
            isActive 
              ? 'bg-indexa-mint/20 scale-110' 
              : 'bg-white/10'
          }`}>
            <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 transition-colors duration-300 ${
              isActive ? 'text-indexa-mint' : 'text-white'
            }`} />
          </div>
        </div>

        <h3 className={`text-lg sm:text-xl font-bold text-center mb-2 sm:mb-3 transition-colors duration-300 ${
          isActive ? 'text-indexa-mint' : 'text-white'
        }`}>
          {title}
        </h3>

        <p className="text-white/90 text-center text-sm sm:text-base mb-3 sm:mb-4">
          {description}
        </p>

        <div className={`overflow-hidden transition-all duration-300 ${
          isActive ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="border-t border-indexa-mint/30 pt-3 sm:pt-4">
            <p className="text-white/80 text-xs sm:text-sm text-center">
              {detail}
            </p>
          </div>
        </div>

        <div className={`absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full transition-all duration-300 ${
          isActive ? 'bg-indexa-mint w-12' : 'bg-white/30'
        }`} />
      </div>
    </div>
  );
};

export default ReasonCard;
