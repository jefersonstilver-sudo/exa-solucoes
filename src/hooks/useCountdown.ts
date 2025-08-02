import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const useCountdown = (targetDate: Date) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        const newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
        
        // Only update if values actually changed
        setTimeLeft(prev => {
          if (prev.days !== newTimeLeft.days || 
              prev.hours !== newTimeLeft.hours || 
              prev.minutes !== newTimeLeft.minutes || 
              prev.seconds !== newTimeLeft.seconds) {
            return newTimeLeft;
          }
          return prev;
        });
      } else {
        setTimeLeft(prev => {
          if (prev.days !== 0 || prev.hours !== 0 || prev.minutes !== 0 || prev.seconds !== 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
          }
          return prev;
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};