import React, { createContext, useContext, ReactNode } from 'react';
import { useAdvancedResponsive, AdvancedDeviceInfo, BreakpointConfig } from '@/hooks/useAdvancedResponsive';

interface ResponsiveContextType extends AdvancedDeviceInfo {
  breakpoints: BreakpointConfig;
  getCurrentBreakpoint: () => string;
  // Utilities
  shouldShowMobileLayout: boolean;
  shouldShowCompactUI: boolean;
  shouldUseBottomNav: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

export const ResponsiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const responsive = useAdvancedResponsive();

  const contextValue: ResponsiveContextType = {
    ...responsive,
    shouldShowMobileLayout: responsive.isMobile,
    shouldShowCompactUI: responsive.isMobile || responsive.isTablet,
    shouldUseBottomNav: responsive.isMobile,
  };

  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsiveContext = () => {
  const context = useContext(ResponsiveContext);
  if (context === undefined) {
    throw new Error('useResponsiveContext must be used within a ResponsiveProvider');
  }
  return context;
};
