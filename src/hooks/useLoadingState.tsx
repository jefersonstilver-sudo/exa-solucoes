import { create } from 'zustand';

interface LoadingState {
  isGlobalLoading: boolean;
  loadingMessage: string;
  loadingProgress: number;
  showProgress: boolean;
  setGlobalLoading: (isLoading: boolean, message?: string) => void;
  setLoadingProgress: (progress: number, showProgress?: boolean) => void;
  resetLoading: () => void;
}

export const useLoadingState = create<LoadingState>((set) => ({
  isGlobalLoading: false,
  loadingMessage: 'Carregando...',
  loadingProgress: 0,
  showProgress: false,
  
  setGlobalLoading: (isLoading: boolean, message = 'Carregando...') =>
    set({ isGlobalLoading: isLoading, loadingMessage: message }),
    
  setLoadingProgress: (progress: number, showProgress = true) =>
    set({ loadingProgress: progress, showProgress }),
    
  resetLoading: () =>
    set({ 
      isGlobalLoading: false, 
      loadingMessage: 'Carregando...', 
      loadingProgress: 0, 
      showProgress: false 
    }),
}));