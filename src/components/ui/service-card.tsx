
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
        return <Calendar size={18} />;
      case 'monitor':
        return <MonitorPlay size={18} />;
      case 'info':
        return <Info size={18} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="card-indexa group relative h-96 overflow-hidden animate-fade-in transition-all duration-300" 
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-indexa-purple-dark/80 to-transparent opacity-70 transition-opacity group-hover:opacity-90"></div>
      
      {/* Efeito de desfoque no hover */}
      <div className="absolute inset-0 backdrop-blur-[0px] transition-all duration-500 group-hover:backdrop-blur-[3px]"></div>
      
      <div className="relative h-full flex flex-col justify-between p-6 z-10">
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        
        <Button 
          className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white border border-white/20 w-full sm:w-auto transition-transform transform group-hover:translate-y-0 translate-y-2"
        >
          {renderIcon()}
          <span className="ml-2">{buttonText}</span>
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;
