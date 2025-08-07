import { useState } from 'react';

interface ScheduleConflict {
  conflictingVideoName: string;
  day: number;
  conflictingTimeRange: string;
  newVideoTimeRange: string;
}

interface ConflictModalData {
  isOpen: boolean;
  conflicts: ScheduleConflict[];
  suggestions: { [day: number]: string[] };
  newVideoName: string;
}

export const useConflictModal = () => {
  const [modalData, setModalData] = useState<ConflictModalData>({
    isOpen: false,
    conflicts: [],
    suggestions: {},
    newVideoName: ''
  });

  const showConflictModal = (
    conflicts: ScheduleConflict[],
    suggestions: { [day: number]: string[] },
    newVideoName: string
  ) => {
    console.log('🚨 [CONFLICT_MODAL] Abrindo modal com dados:', {
      conflicts,
      suggestions,
      newVideoName
    });
    setModalData({
      isOpen: true,
      conflicts,
      suggestions,
      newVideoName
    });
  };

  const hideConflictModal = () => {
    setModalData(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  const resetConflictModal = () => {
    setModalData({
      isOpen: false,
      conflicts: [],
      suggestions: {},
      newVideoName: ''
    });
  };

  return {
    ...modalData,
    showConflictModal,
    hideConflictModal,
    resetConflictModal
  };
};