
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
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay escurecido para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-all duration-300"></div>
      
      {/* Blur effect that disappears on hover */}
      <div className="absolute inset-0 backdrop-blur-[2px] group-hover:backdrop-blur-0 transition-all duration-300"></div>
      
      <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        
        <Button 
          className="mt-auto self-start bg-indexa-mint text-indexa-purple-dark hover:bg-white rounded-full flex items-center space-x-2 text-base font-medium px-6 py-2 hover:scale-105 transition-transform"
        >
          {renderIcon()}
          <span className="ml-2">{buttonText}</span>
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;
