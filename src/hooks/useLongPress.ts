import { useCallback, useRef, useState } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number; // milliseconds
}

export const useLongPress = ({ onLongPress, onClick, threshold = 500 }: UseLongPressOptions) => {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // Prevent text selection during long press
    e.preventDefault();
    
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsLongPressing(true);
      
      // Haptic feedback (vibration) on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      onLongPress();
    }, threshold);
  }, [onLongPress, threshold]);

  const stop = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // If it wasn't a long press, trigger onClick
    if (!isLongPressRef.current && onClick) {
      onClick();
    }
    
    setIsLongPressing(false);
  }, [onClick]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsLongPressing(false);
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: cancel,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: cancel,
    isLongPressing,
  };
};
