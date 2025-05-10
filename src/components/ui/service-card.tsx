
import React from 'react';
import { Coffee, Film, Satellite } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  title: string;
  backgroundImage: string;
  buttonText: string;
  buttonIcon: 'calendar' | 'monitor' | 'info';
  className?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  backgroundImage,
  buttonText,
  buttonIcon,
  className,
}) => {
  const renderIcon = () => {
    switch (buttonIcon) {
      case 'calendar':
        return <Coffee className="w-5 h-5" />;
      case 'monitor':
        return <Film className="w-5 h-5" />;
      case 'info':
        return <Satellite className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        'relative h-[420px] overflow-hidden rounded-2xl group transition-all duration-300 p-6 shadow-xl',
        className
      )}
      style={{
        background: `linear-gradient(to bottom, rgba(24, 0, 36, 0.85), rgba(56, 6, 79, 0.95)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Elegant gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A1F2C]/90 to-[#38064F]/80 group-hover:opacity-90 transition-all duration-300"></div>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 group-hover:backdrop-blur-sm transition-all duration-500"></div>
      
      <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        
        <Button 
          className="mt-auto self-start bg-indexa-mint text-indexa-purple-dark hover:bg-white rounded-full flex items-center space-x-2 text-base font-medium px-6 py-2 hover:scale-105 transition-transform"
        >
          {renderIcon()}
          <span>{buttonText}</span>
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;
