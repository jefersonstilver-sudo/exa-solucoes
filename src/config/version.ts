// Dynamic versioning based on build timestamp - injected by Vite
declare const __BUILD_TIMESTAMP__: number;

// Use injected timestamp or fallback to runtime Date.now()
export const BUILD_TIMESTAMP = typeof __BUILD_TIMESTAMP__ !== 'undefined' 
  ? __BUILD_TIMESTAMP__ 
  : Date.now();

// Version is now build-based, not static
export const APP_VERSION = `5.0.${BUILD_TIMESTAMP}`;
export const VERSION_KEY = 'app-version';

export const getStoredVersion = () => {
  return localStorage.getItem(VERSION_KEY);
};

export const setStoredVersion = () => {
  localStorage.setItem(VERSION_KEY, APP_VERSION);
};

export const hasVersionChanged = () => {
  const stored = getStoredVersion();
  if (stored === null) return false;
  const storedPrefix = stored.split('.').slice(0, 2).join('.');
  const currentPrefix = APP_VERSION.split('.').slice(0, 2).join('.');
  return storedPrefix !== currentPrefix;
};
