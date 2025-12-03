import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'sidebar_width';
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const COLLAPSE_THRESHOLD = 180;
const DEFAULT_WIDTH = 256;
const COLLAPSED_WIDTH = 56;

export const useSidebarResize = () => {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const [shouldCollapse, setShouldCollapse] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(DEFAULT_WIDTH);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedWidth = parseInt(stored, 10);
        if (!isNaN(parsedWidth) && parsedWidth >= MIN_WIDTH && parsedWidth <= MAX_WIDTH) {
          setWidth(parsedWidth);
        } else if (parsedWidth < COLLAPSE_THRESHOLD) {
          setShouldCollapse(true);
        }
      }
    } catch (e) {
      console.error('Failed to load sidebar width:', e);
    }
  }, []);

  // Save to localStorage when width changes (debounced)
  useEffect(() => {
    if (isDragging) return;
    try {
      if (shouldCollapse) {
        localStorage.setItem(STORAGE_KEY, String(COLLAPSED_WIDTH));
      } else {
        localStorage.setItem(STORAGE_KEY, String(width));
      }
    } catch (e) {
      console.error('Failed to save sidebar width:', e);
    }
  }, [width, shouldCollapse, isDragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startXRef.current;
    const newWidth = startWidthRef.current + deltaX;

    if (newWidth < COLLAPSE_THRESHOLD) {
      setShouldCollapse(true);
    } else {
      setShouldCollapse(false);
      setWidth(Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH));
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Global event listeners
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

  // Double-click to toggle collapse
  const handleDoubleClick = useCallback(() => {
    setShouldCollapse(prev => !prev);
    if (shouldCollapse) {
      setWidth(DEFAULT_WIDTH);
    }
  }, [shouldCollapse]);

  // Calculate text opacity for smooth fade
  const textOpacity = shouldCollapse ? 0 : Math.min(1, Math.max(0, (width - MIN_WIDTH) / 50 + 0.5));

  return {
    width: shouldCollapse ? COLLAPSED_WIDTH : width,
    isDragging,
    shouldCollapse,
    handleMouseDown,
    handleDoubleClick,
    textOpacity,
    MIN_WIDTH,
    MAX_WIDTH,
    COLLAPSED_WIDTH
  };
};
