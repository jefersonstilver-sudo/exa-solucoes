import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'sidebar-width';
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const COLLAPSE_THRESHOLD = 180;
const DEFAULT_WIDTH = 280;

export function useSidebarResize() {
  const [width, setWidth] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        // Ensure minimum visible width
        return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parsed));
      }
      return DEFAULT_WIDTH;
    } catch {
      return DEFAULT_WIDTH;
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(width));
    } catch (e) {
      console.error('Failed to save sidebar width:', e);
    }
  }, [width]);

  // Never auto-collapse - just track if at minimum width
  const isCollapsed = false;

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const delta = e.clientX - startXRef.current;
    let newWidth = startWidthRef.current + delta;
    
    // Snap to collapsed when near threshold
    if (newWidth < COLLAPSE_THRESHOLD) {
      newWidth = MIN_WIDTH;
    } else {
      newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
    }
    
    setWidth(newWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Attach global listeners when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const expand = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
  }, []);

  const collapse = useCallback(() => {
    setWidth(MIN_WIDTH);
  }, []);

  const toggle = useCallback(() => {
    setWidth(prev => prev <= MIN_WIDTH ? DEFAULT_WIDTH : MIN_WIDTH);
  }, []);

  return {
    width,
    isDragging,
    isCollapsed,
    startResize,
    expand,
    collapse,
    toggle,
    minWidth: MIN_WIDTH,
    maxWidth: MAX_WIDTH
  };
}
