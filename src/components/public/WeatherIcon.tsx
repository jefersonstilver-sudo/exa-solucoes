import React from 'react';
import { Cloud, CloudRain, CloudSnow, CloudLightning, Sun, CloudFog } from 'lucide-react';

interface WeatherIconProps {
  icon: string;
  className?: string;
}

const WeatherIcon: React.FC<WeatherIconProps> = ({ icon, className = "h-6 w-6" }) => {
  switch (icon) {
    case 'clear':
      return <Sun className={className} />;
    case 'partly-cloudy':
      return <Cloud className={className} />;
    case 'fog':
      return <CloudFog className={className} />;
    case 'rain':
      return <CloudRain className={className} />;
    case 'snow':
      return <CloudSnow className={className} />;
    case 'storm':
      return <CloudLightning className={className} />;
    default:
      return <Sun className={className} />;
  }
};

export default WeatherIcon;
