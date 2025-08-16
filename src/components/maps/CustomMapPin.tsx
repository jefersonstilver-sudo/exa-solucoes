import React from 'react';

interface CustomMapPinProps {
  status?: 'ativo' | 'manutenção' | 'inativo';
  isHovered?: boolean;
  isSelected?: boolean;
  panelCount?: number;
}

const CustomMapPin: React.FC<CustomMapPinProps> = ({
  status = 'ativo',
  isHovered = false,
  isSelected = false,
  panelCount = 0
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'ativo': return 'hsl(var(--primary))';
      case 'manutenção': return 'hsl(var(--warning))';
      case 'inativo': return 'hsl(var(--muted))';
      default: return 'hsl(var(--primary))';
    }
  };

  const getScale = () => {
    if (isSelected) return 1.3;
    if (isHovered) return 1.15;
    return 1;
  };

  const pinSize = isSelected ? 40 : isHovered ? 36 : 32;
  const shadowOpacity = isSelected ? 0.4 : isHovered ? 0.3 : 0.2;

  return (
    <div 
      className="relative transition-transform duration-200 ease-out"
      style={{ transform: `scale(${getScale()})` }}
    >
      {/* Pin Shadow */}
      <div 
        className="absolute rounded-full blur-sm"
        style={{
          width: pinSize * 0.8,
          height: pinSize * 0.3,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          bottom: -2,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: shadowOpacity
        }}
      />
      
      {/* Main Pin SVG */}
      <svg 
        width={pinSize} 
        height={pinSize * 1.2} 
        viewBox="0 0 32 38" 
        className="drop-shadow-lg"
      >
        <defs>
          <linearGradient id={`pinGradient-${status}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={getStatusColor()} />
            <stop offset="100%" stopColor={getStatusColor()} stopOpacity="0.8" />
          </linearGradient>
          <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {/* Pin Body */}
        <path
          d="M16 2C10.48 2 6 6.48 6 12c0 8 10 22 10 22s10-14 10-22c0-5.52-4.48-10-10-10z"
          fill={`url(#pinGradient-${status})`}
          stroke="white"
          strokeWidth="1.5"
          filter="url(#pinShadow)"
        />
        
        {/* Inner Circle */}
        <circle
          cx="16"
          cy="12"
          r="5"
          fill="white"
          stroke={getStatusColor()}
          strokeWidth="2"
        />
        
        {/* Panel Count Badge */}
        {panelCount > 0 && (
          <>
            <circle
              cx="24"
              cy="8"
              r="6"
              fill="hsl(var(--accent))"
              stroke="white"
              strokeWidth="1.5"
            />
            <text
              x="24"
              y="11"
              textAnchor="middle"
              fontSize="8"
              fontWeight="bold"
              fill="white"
            >
              {panelCount > 9 ? '9+' : panelCount}
            </text>
          </>
        )}
      </svg>
      
      {/* Pulse Animation for Active Status */}
      {status === 'ativo' && isSelected && (
        <div 
          className="absolute top-0 left-0 rounded-full animate-ping"
          style={{
            width: pinSize,
            height: pinSize,
            backgroundColor: getStatusColor(),
            opacity: 0.3
          }}
        />
      )}
    </div>
  );
};

export default CustomMapPin;