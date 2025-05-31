
import React, { useState, useEffect } from 'react';

const ScrollProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-50">
      <div 
        className="h-full bg-gradient-to-r from-indexa-purple via-indexa-mint to-indexa-purple transition-all duration-300 ease-out shadow-lg"
        style={{ 
          width: `${scrollProgress}%`,
          boxShadow: '0 0 10px rgba(88, 227, 171, 0.5)'
        }}
      />
    </div>
  );
};

export default ScrollProgressBar;
