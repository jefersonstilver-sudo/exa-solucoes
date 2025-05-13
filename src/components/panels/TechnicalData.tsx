
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
    <div className="bg-gray-50 p-3 rounded-md mb-6 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="font-medium text-gray-700">ID Painel:</span> {panelId.substring(0, 8)}...
        </div>
        <div>
          <span className="font-medium text-gray-700">Código:</span> {code}
        </div>
        <div>
          <span className="font-medium text-gray-700">Building ID:</span> {buildingId.substring(0, 8)}...
        </div>
        <div>
          <span className="font-medium text-gray-700">Tipo:</span> {Math.random() > 0.5 ? 'Smart TV' : 'Digital Signage'}
        </div>
      </div>
    </div>
  );
};
