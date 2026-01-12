import React from 'react';

const ERPCircuitBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      <svg
        className="absolute w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="circuitPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            {/* Linhas horizontais */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="white" strokeWidth="0.5" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="white" strokeWidth="0.5" />
            
            {/* Linhas verticais */}
            <line x1="25" y1="0" x2="25" y2="100" stroke="white" strokeWidth="0.5" />
            <line x1="75" y1="0" x2="75" y2="100" stroke="white" strokeWidth="0.5" />
            
            {/* Nós */}
            <circle cx="25" cy="25" r="3" fill="white" />
            <circle cx="75" cy="25" r="3" fill="white" />
            <circle cx="25" cy="75" r="3" fill="white" />
            <circle cx="75" cy="75" r="3" fill="white" />
            
            {/* Conexões diagonais */}
            <line x1="25" y1="25" x2="50" y2="50" stroke="white" strokeWidth="0.5" />
            <line x1="75" y1="25" x2="50" y2="50" stroke="white" strokeWidth="0.5" />
            <line x1="25" y1="75" x2="50" y2="50" stroke="white" strokeWidth="0.5" />
            <line x1="75" y1="75" x2="50" y2="50" stroke="white" strokeWidth="0.5" />
            
            {/* Nó central */}
            <circle cx="50" cy="50" r="4" fill="white" />
            <circle cx="50" cy="50" r="6" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#circuitPattern)" />
        
        {/* Elementos decorativos grandes */}
        <g opacity="0.3">
          {/* Círculo grande */}
          <circle cx="600" cy="150" r="80" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="600" cy="150" r="60" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="600" cy="150" r="40" fill="none" stroke="white" strokeWidth="0.5" />
          
          {/* Linhas de conexão */}
          <line x1="520" y1="150" x2="400" y2="150" stroke="white" strokeWidth="1" />
          <line x1="600" y1="230" x2="600" y2="350" stroke="white" strokeWidth="1" />
          
          {/* Círculo médio */}
          <circle cx="200" cy="500" r="60" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="200" cy="500" r="40" fill="none" stroke="white" strokeWidth="0.5" />
          
          {/* Linhas horizontais longas */}
          <line x1="0" y1="400" x2="800" y2="400" stroke="white" strokeWidth="0.3" />
          <line x1="0" y1="600" x2="800" y2="600" stroke="white" strokeWidth="0.3" />
          
          {/* Hexágono */}
          <polygon 
            points="500,600 540,575 540,525 500,500 460,525 460,575" 
            fill="none" 
            stroke="white" 
            strokeWidth="0.5"
          />
          
          {/* Nós de conexão maiores */}
          <circle cx="400" cy="150" r="5" fill="white" />
          <circle cx="600" cy="350" r="5" fill="white" />
          <circle cx="260" cy="500" r="5" fill="white" />
          <circle cx="140" cy="500" r="5" fill="white" />
          
          {/* Linhas de grade diagonal */}
          <line x1="0" y1="200" x2="300" y2="0" stroke="white" strokeWidth="0.3" />
          <line x1="0" y1="400" x2="500" y2="0" stroke="white" strokeWidth="0.3" />
          <line x1="0" y1="600" x2="700" y2="0" stroke="white" strokeWidth="0.3" />
          <line x1="100" y1="800" x2="800" y2="100" stroke="white" strokeWidth="0.3" />
          <line x1="300" y1="800" x2="800" y2="300" stroke="white" strokeWidth="0.3" />
        </g>
        
        {/* Pontos brilhantes animados */}
        <g>
          <circle cx="600" cy="150" r="2" fill="white">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="200" cy="500" r="2" fill="white">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="500" cy="550" r="2" fill="white">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="350" cy="300" r="2" fill="white">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  );
};

export default ERPCircuitBackground;
