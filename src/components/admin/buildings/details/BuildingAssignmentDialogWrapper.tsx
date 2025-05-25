
import React from 'react';
import PanelAssignmentDialog from '../panels/PanelAssignmentDialog';

interface BuildingAssignmentDialogWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: any;
  onSuccess: () => void;
}

const BuildingAssignmentDialogWrapper: React.FC<BuildingAssignmentDialogWrapperProps> = ({
  open,
  onOpenChange,
  building,
  onSuccess
}) => {
  return (
    <PanelAssignmentDialog
      open={open}
      onOpenChange={onOpenChange}
      buildingId={building?.id}
      buildingName={building?.nome}
      onSuccess={onSuccess}
    />
  );
};

export default BuildingAssignmentDialogWrapper;
