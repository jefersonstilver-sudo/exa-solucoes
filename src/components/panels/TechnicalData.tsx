
import React from 'react';

interface TechnicalDataProps {
  panelId: string;
  code: string;
  buildingId: string;
}

export const TechnicalData: React.FC<TechnicalDataProps> = ({
  panelId,
  code,
  buildingId
}) => {
  return (
    <div className="bg-background/50 p-3 rounded-md mb-6 text-xs border">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="font-medium text-foreground">ID Painel:</span> 
          <span className="font-mono text-muted-foreground ml-1">
            {panelId.substring(0, 8)}...
          </span>
        </div>
        <div>
          <span className="font-medium text-foreground">Código:</span> 
          <span className="font-mono text-muted-foreground ml-1">{code}</span>
        </div>
        <div>
          <span className="font-medium text-foreground">Building ID:</span> 
          <span className="font-mono text-muted-foreground ml-1">
            {buildingId.substring(0, 8)}...
          </span>
        </div>
        <div>
          <span className="font-medium text-foreground">Tipo:</span> 
          <span className="text-muted-foreground ml-1">Digital Signage</span>
        </div>
      </div>
    </div>
  );
};
