
import { useState, useCallback } from 'react';

interface SuccessPopupState {
  isOpen: boolean;
  videoName?: string;
}

export const useSuccessPopup = () => {
  const [popupState, setPopupState] = useState<SuccessPopupState>({
    isOpen: false,
    videoName: undefined
  });

  const showSuccess = useCallback((videoName?: string) => {
    setPopupState({
      isOpen: true,
      videoName
    });

    // Auto-fechar após 5 segundos
    setTimeout(() => {
      setPopupState(prev => ({ ...prev, isOpen: false }));
    }, 5000);
  }, []);

  const hideSuccess = useCallback(() => {
    setPopupState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    isOpen: popupState.isOpen,
    videoName: popupState.videoName,
    showSuccess,
    hideSuccess
  };
};
