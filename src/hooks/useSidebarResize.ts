import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'sidebar_width';
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 256;

export const useSidebarResize = () => {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          setWidth(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load sidebar width:', e);
    }
  }, []);

  // Save to localStorage when width changes (debounced via isDragging)
  useEffect(() => {
    if (isDragging) return; // Don't save while dragging
    try {
      localStorage.setItem(STORAGE_KEY, String(width));
    } catch (e) {
      console.error('Failed to save sidebar width:', e);
    }
  }, [width, isDragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const delta = e.clientX - startXRef.current;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
    setWidth(newWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch support for mobile/tablet
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
    startWidthRef.current = width;
  }, [width]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    
    const delta = e.touches[0].clientX - startXRef.current;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
    setWidth(newWidth);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global event listeners during drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      // Visual feedback during drag
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const resetWidth = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
  }, []);

  return {
    width,
    isDragging,
    handleMouseDown,
    handleTouchStart,
    resetWidth,
    MIN_WIDTH,
    MAX_WIDTH,
    DEFAULT_WIDTH,
  };
};
