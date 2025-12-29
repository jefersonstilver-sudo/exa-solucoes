import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import React from 'react';

interface PrivacyModeState {
  isPrivate: boolean;
  togglePrivacy: () => void;
}

export const usePrivacyModeStore = create<PrivacyModeState>()(
  persist(
    (set) => ({
      isPrivate: false,
      togglePrivacy: () => set((state) => ({ isPrivate: !state.isPrivate })),
    }),
    { name: 'dashboard-privacy-mode' }
  )
);

export const usePrivacyMode = () => {
  const { isPrivate, togglePrivacy } = usePrivacyModeStore();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ALT + M para toggle do modo privado
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        togglePrivacy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePrivacy]);

  return { isPrivate, togglePrivacy };
};
