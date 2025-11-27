import { useState, useCallback } from 'react';

export const useTimelineZoom = (initialZoom = 1) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [pixelsPerHour, setPixelsPerHour] = useState(100);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.5, 10));
    setPixelsPerHour(prev => Math.min(prev + 50, 500));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
    setPixelsPerHour(prev => Math.max(prev - 50, 50));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPixelsPerHour(100);
  }, []);

  return {
    zoom,
    pixelsPerHour,
    handleZoomIn,
    handleZoomOut,
    resetZoom,
  };
};
