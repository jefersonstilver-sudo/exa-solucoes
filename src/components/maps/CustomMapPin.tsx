import React from 'react';

interface CustomMapPinProps {
  status?: 'ativo' | 'manutenção' | 'instalação' | 'inativo';
  isHovered?: boolean;
  isSelected?: boolean;
}

const CustomMapPin: React.FC<CustomMapPinProps> = ({
  status = 'ativo',
  isHovered = false,
  isSelected = false
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'ativo': return '#10B981'; // Verde
      case 'manutenção': return '#f59e0b'; // Laranja
      case 'instalação': return '#3B82F6'; // Azul
      case 'inativo': return '#6b7280'; // Cinza
      default: return '#10B981';
    }
  };

  const getScale = () => {
    if (isSelected) return 1.4;
    if (isHovered) return 1.2;
    return 1;
  };

  const pinSize = isSelected ? 44 : isHovered ? 40 : 36;
  const shadowOpacity = isSelected ? 0.6 : isHovered ? 0.4 : 0.3;

  return (
    <div 
      className="relative transition-all duration-300 ease-out"
      style={{ transform: `scale(${getScale()})` }}
    >
      {/* Enhanced 3D Shadow */}
      <div 
        className="absolute rounded-full blur-md"
        style={{
          width: pinSize * 0.9,
          height: pinSize * 0.4,
          background: `radial-gradient(ellipse, rgba(60, 19, 97, ${shadowOpacity}) 0%, rgba(0, 0, 0, ${shadowOpacity * 0.3}) 70%, transparent 100%)`,
          bottom: -4,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
      
      {/* Main Pin SVG with 3D Enhancement */}
      <svg 
        width={pinSize} 
        height={pinSize * 1.2} 
        viewBox="0 0 32 38" 
        className="drop-shadow-2xl"
      >
        <defs>
          {/* 3D Gradient */}
          <linearGradient id={`pinGradient-${status}`} x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="20%" stopColor={getStatusColor()} />
            <stop offset="80%" stopColor={getStatusColor()} />
            <stop offset="100%" stopColor="#1F2937" />
          </linearGradient>
          
          {/* Highlight Gradient */}
          <linearGradient id={`pinHighlight-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
          
          {/* Enhanced Shadow Filter */}
          <filter id="pinShadow3D" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#3C1361" floodOpacity="0.4"/>
            <feDropShadow dx="0" dy="2" stdDeviation="1" floodColor="#000000" floodOpacity="0.2"/>
          </filter>
          
          {/* Inner Glow */}
          <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Pin Body with 3D Effect */}
        <path
          d="M16 2C10.48 2 6 6.48 6 12c0 8 10 22 10 22s10-14 10-22c0-5.52-4.48-10-10-10z"
          fill={`url(#pinGradient-${status})`}
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="2"
          filter="url(#pinShadow3D)"
        />
        
        {/* 3D Highlight */}
        <path
          d="M16 2C12 2 8.5 4.5 8.5 10c0 4 5 12 7.5 18 2.5-6 7.5-14 7.5-18 0-5.5-3.5-8-7.5-8z"
          fill={`url(#pinHighlight-${status})`}
          opacity="0.6"
        />
        
        {/* Inner Circle with 3D effect */}
        <circle
          cx="16"
          cy="12"
          r="6"
          fill="rgba(255,255,255,0.95)"
          stroke={getStatusColor()}
          strokeWidth="2.5"
          filter="url(#innerGlow)"
        />
        
        {/* Inner Circle Highlight */}
        <circle
          cx="14"
          cy="10"
          r="2"
          fill="rgba(255,255,255,0.8)"
          opacity="0.7"
        />
        
      </svg>
      
      {/* Enhanced Pulse Animation for Active Status */}
      {status === 'ativo' && isSelected && (
        <>
          <div 
            className="absolute top-1 left-1 rounded-full animate-ping"
            style={{
              width: pinSize - 2,
              height: pinSize - 2,
              background: `radial-gradient(circle, ${getStatusColor()}40 0%, ${getStatusColor()}20 50%, transparent 100%)`,
            }}
          />
          <div 
            className="absolute top-2 left-2 rounded-full animate-pulse"
            style={{
              width: pinSize - 4,
              height: pinSize - 4,
              background: `radial-gradient(circle, ${getStatusColor()}20 0%, transparent 70%)`,
            }}
          />
        </>
      )}
    </div>
  );
};

export default CustomMapPin;