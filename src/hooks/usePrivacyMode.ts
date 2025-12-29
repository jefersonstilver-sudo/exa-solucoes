import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'dashboard-privacy-mode';

// Simple hook for privacy mode - no external dependencies
export const usePrivacyModeStore = () => {
  const [isPrivate, setIsPrivate] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        setIsPrivate(stored === 'true');
      } catch {}
    };

    window.addEventListener('storage', handleStorage);
    
    // Also listen for custom event for same-tab updates
    const handlePrivacyChange = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        setIsPrivate(stored === 'true');
      } catch {}
    };
    window.addEventListener('privacy-mode-change', handlePrivacyChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('privacy-mode-change', handlePrivacyChange);
    };
  }, []);

  const togglePrivacy = useCallback(() => {
    const newValue = !isPrivate;
    setIsPrivate(newValue);
    try {
      localStorage.setItem(STORAGE_KEY, String(newValue));
      window.dispatchEvent(new CustomEvent('privacy-mode-change'));
    } catch {}
  }, [isPrivate]);

  return { isPrivate, togglePrivacy };
};

// Hook with keyboard shortcut listener (ALT+M)
export const usePrivacyMode = () => {
  const { isPrivate, togglePrivacy } = usePrivacyModeStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
