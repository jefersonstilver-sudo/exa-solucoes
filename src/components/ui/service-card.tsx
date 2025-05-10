
import React from 'react';
import { Calendar, Monitor, Info } from 'lucide-react';
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
        return <Calendar className="w-4 h-4" />;
      case 'monitor':
        return <Monitor className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        'relative h-[420px] overflow-hidden rounded-xl group',
        className
      )}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay escurecido para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all duration-300"></div>
      
      <div className="absolute inset-0 p-8 flex flex-col justify-between">
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        
        <Button 
          className="mt-auto self-start bg-indexa-mint text-indexa-purple-dark hover:bg-white rounded-full flex items-center space-x-2"
        >
          {renderIcon()}
          <span>{buttonText}</span>
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;
