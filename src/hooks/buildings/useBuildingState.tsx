
import { useState } from 'react';

interface BuildingState {
  selectedBuilding: any;
  isFormOpen: boolean;
  isDetailsOpen: boolean;
  isImageManagerOpen: boolean;
  operationLoading: boolean;
}

export const useBuildingState = () => {
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);

  const resetState = () => {
    setSelectedBuilding(null);
    setIsFormOpen(false);
    setIsDetailsOpen(false);
    setIsImageManagerOpen(false);
    setOperationLoading(false);
  };

  return {
    selectedBuilding,
    setSelectedBuilding,
    isFormOpen,
    setIsFormOpen,
    isDetailsOpen,
    setIsDetailsOpen,
    isImageManagerOpen,
    setIsImageManagerOpen,
    operationLoading,
    setOperationLoading,
    resetState
  };
};
