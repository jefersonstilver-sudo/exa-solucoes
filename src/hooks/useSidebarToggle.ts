
import { useState, useCallback } from 'react';

export const useSidebarToggle = (defaultCollapsed = false) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggle = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  const expand = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  return {
    isCollapsed,
    toggle,
    collapse,
    expand
  };
};
