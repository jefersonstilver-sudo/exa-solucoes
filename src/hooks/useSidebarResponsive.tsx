import { useState, useEffect, useCallback } from 'react';
import { useMobileBreakpoints } from './useMobileBreakpoints';

export interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  variant: 'drawer' | 'sidebar' | 'bottom-nav';
}

export const useSidebarResponsive = () => {
  const { isMobile, isTablet } = useMobileBreakpoints();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determinar variante baseada no dispositivo
  const variant: SidebarState['variant'] = isMobile ? 'drawer' : isTablet ? 'sidebar' : 'sidebar';

  // Auto-fechar drawer em mobile quando a tela for redimensionada
  useEffect(() => {
    if (!isMobile && isOpen) {
      setIsOpen(false);
    }
  }, [isMobile, isOpen]);

  // Auto-expandir sidebar em desktop
  useEffect(() => {
    if (!isMobile && !isTablet) {
      setIsCollapsed(false);
    }
  }, [isMobile, isTablet]);

  const toggle = useCallback(() => {
    if (isMobile) {
      setIsOpen(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  }, [isMobile]);

  const open = useCallback(() => {
    if (isMobile) {
      setIsOpen(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isMobile]);

  const close = useCallback(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  const closeMobileDrawer = useCallback(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  return {
    isOpen: isMobile ? isOpen : !isCollapsed,
    isCollapsed: isMobile ? false : isCollapsed,
    variant,
    isMobileDrawerOpen: isMobile && isOpen,
    toggle,
    open,
    close,
    closeMobileDrawer
  };
};