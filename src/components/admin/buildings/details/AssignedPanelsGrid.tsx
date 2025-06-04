
import React from 'react';
import AssignedPanelCard from './AssignedPanelCard';

interface AssignedPanelsGridProps {
  panels: any[];
  unassigningPanelId: string | null;
  onViewDetails: (panel: any) => void;
  onUnassign: (panel: any) => void;
}

const AssignedPanelsGrid: React.FC<AssignedPanelsGridProps> = ({
  panels,
  unassigningPanelId,
  onViewDetails,
  onUnassign
}) => {
  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Total de <span className="font-semibold">{panels.length}</span> painéis atribuídos a este prédio
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {panels.map((panel) => (
          <AssignedPanelCard
            key={panel.id}
            panel={panel}
            onViewDetails={onViewDetails}
            onUnassign={onUnassign}
            isUnassigning={unassigningPanelId === panel.id}
          />
        ))}
      </div>
    </div>
  );
};

export default AssignedPanelsGrid;
