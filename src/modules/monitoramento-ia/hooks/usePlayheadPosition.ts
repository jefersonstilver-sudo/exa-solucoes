import { useState, useEffect } from 'react';

export const usePlayheadPosition = (pixelsPerHour: number, startHour = 0) => {
  const [position, setPosition] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      setCurrentTime(now);
      
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      
      const totalHours = hours - startHour + minutes / 60 + seconds / 3600;
      const newPosition = totalHours * pixelsPerHour;
      
      setPosition(newPosition);
    };

    updatePosition();
    const interval = setInterval(updatePosition, 1000);

    return () => clearInterval(interval);
  }, [pixelsPerHour, startHour]);

  return { position, currentTime };
};
