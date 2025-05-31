
import React from 'react';
import { Coffee, Film, Satellite } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ServiceCardProps {
  title: string;
  backgroundImage: string;
  buttonText: string;
  buttonIcon: 'calendar' | 'monitor' | 'info';
  href: string;
  className?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  backgroundImage,
  buttonText,
  buttonIcon,
  href,
  className,
}) => {
  const navigate = useNavigate();

  console.log('ServiceCard props:', { title, href });

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

  const handleClick = () => {
    console.log('ServiceCard clicked:', { title, href });
    
    // Redirecionar para a nova landing page se for painéis publicitários
    if (title === 'Painéis Publicitários') {
      console.log('Navigating to /paineis-publicitarios');
      navigate('/paineis-publicitarios');
    } else {
      console.log('Navigating to:', href);
      navigate(href);
    }
  };

  return (
    <div 
      className={cn(
        'relative h-[420px] overflow-hidden rounded-2xl group transition-all duration-300 p-6 transform hover:-translate-y-2 hover:shadow-xl cursor-pointer',
        className
      )}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={handleClick}
    >
      {/* Overlay escurecido para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300"></div>
      
      {/* Blur effect that disappears on hover */}
      <div className="absolute inset-0 backdrop-blur-[2px] group-hover:backdrop-blur-0 transition-all duration-300"></div>
      
      <div className="absolute inset-0 p-6 flex flex-col justify-between">
        <h2 className="text-2xl font-bold text-white relative z-10 transform group-hover:scale-110 transition-transform duration-300">{title}</h2>
        
        <Button 
          className="mt-auto self-start bg-indexa-mint text-indexa-purple-dark hover:bg-white rounded-full flex items-center space-x-2 text-base font-medium px-6 py-2 hover:scale-110 transition-transform shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          {renderIcon()}
          <span className="ml-2">{buttonText}</span>
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;
