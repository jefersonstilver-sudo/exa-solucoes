
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MonitorPlay, Info } from 'lucide-react';

interface ServiceCardProps {
  title: string;
  backgroundImage: string;
  buttonText: string;
  buttonIcon: 'calendar' | 'monitor' | 'info';
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  title, 
  backgroundImage, 
  buttonText, 
  buttonIcon 
}) => {
  const renderIcon = () => {
    switch (buttonIcon) {
      case 'calendar':
        return <Calendar size={16} className="mr-1" />;
      case 'monitor':
        return <MonitorPlay size={16} className="mr-1" />;
      case 'info':
        return <Info size={16} className="mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="card-indexa group relative h-[440px] overflow-hidden rounded-md animate-fade-in transition-all duration-300" 
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black opacity-40 transition-opacity group-hover:opacity-60"></div>
      
      {/* Efeito de desfoque no hover */}
      <div className="absolute inset-0 backdrop-blur-[0px] transition-all duration-500 group-hover:backdrop-blur-[3px]"></div>
      
      <div className="relative h-full flex flex-col justify-between p-6 z-10">
        <h3 className="text-2xl text-white">{title}</h3>
        
        <Button 
          variant="ghost"
          className="bg-black/50 text-white border-none self-start rounded-full backdrop-blur-sm w-auto transition-transform transform hover:bg-black/60"
          size="sm"
        >
          {renderIcon()}
          <span>{buttonText}</span>
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;
