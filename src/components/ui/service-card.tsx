
import React from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ServiceCardProps {
  title: string;
  backgroundImage: string;
  href: string;
  className?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  backgroundImage,
  href,
  className,
}) => {
  const navigate = useNavigate();

  console.log('ServiceCard props:', { title, href });

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
        'relative overflow-hidden rounded-2xl group transition-all duration-300 p-3 md:p-6 transform hover:-translate-y-2 hover:shadow-xl cursor-pointer',
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
      
      {/* Service name at the top */}
      <div className="absolute top-3 md:top-6 left-3 md:left-6 right-3 md:right-6 z-20">
        <h3 className="text-sm md:text-lg font-semibold text-white bg-black bg-opacity-50 px-3 py-1 rounded-lg backdrop-blur-sm">
          {title}
        </h3>
      </div>
      
      {/* Main title in the center */}
      <div className="absolute inset-0 p-3 md:p-6 flex items-center justify-center">
        <h2 className="text-lg md:text-2xl font-bold text-white relative z-10 transform group-hover:scale-110 transition-transform duration-300 leading-tight text-center">{title}</h2>
      </div>
    </div>
  );
};

export default ServiceCard;
