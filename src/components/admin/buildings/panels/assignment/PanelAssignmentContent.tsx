
import React from 'react';
import PanelAssignmentFilters from './PanelAssignmentFilters';
import PanelAssignmentList from './PanelAssignmentList';

interface Panel {
  id: string;
  code: string;
  status: string;
  resolucao?: string;
}

interface PanelAssignmentContentProps {
  searchTerm: string;
  statusFilter: string;
  filteredPanels: Panel[];
  selectedPanels: string[];
  fetchLoading: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPanelToggle: (panelId: string) => void;
}

const PanelAssignmentContent: React.FC<PanelAssignmentContentProps> = ({
  searchTerm,
  statusFilter,
  filteredPanels,
  selectedPanels,
  fetchLoading,
  onSearchChange,
  onStatusFilterChange,
  onPanelToggle
}) => {
  return (
    <div className="flex-1 overflow-hidden flex flex-col space-y-4">
      <PanelAssignmentFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={onSearchChange}
        onStatusFilterChange={onStatusFilterChange}
      />

      <div className="flex-1 overflow-y-auto">
        <PanelAssignmentList
          panels={filteredPanels}
          selectedPanels={selectedPanels}
          loading={fetchLoading}
          onPanelToggle={onPanelToggle}
        />
      </div>
    </div>
  );
};

export default PanelAssignmentContent;
