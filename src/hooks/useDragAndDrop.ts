
import { useCallback } from 'react';

export interface UseDragAndDropProps {
  onFileSelected: (file: File) => void;
}

export const useDragAndDrop = ({ onFileSelected }: UseDragAndDropProps) => {
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      onFileSelected(videoFile);
    }
  }, [onFileSelected]);

  return {
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};
