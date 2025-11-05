import { useLoginTracking } from '@/hooks/tracking/useLoginTracking';

/**
 * Global component that tracks user login/logout automatically
 * Add this to App.tsx before Routes
 */
export const GlobalActivityTracker = () => {
  useLoginTracking();
  return null;
};
