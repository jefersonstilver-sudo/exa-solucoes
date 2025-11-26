import React, { useEffect, useState } from 'react';

const PWASplashScreen = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Auto-hide after 2 seconds
    const timer = setTimeout(() => {
      setShow(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-[#9C1E1E] to-[#5C1A1A] animate-fade-in">
      <div className="flex flex-col items-center justify-center animate-pulse">
        <img 
          src="/icons/icon-512x512.png" 
          alt="EXA Mídia" 
          className="w-32 h-32 drop-shadow-2xl"
        />
        <p className="mt-4 text-white/80 text-center font-medium tracking-wider">
          EXA MÍDIA
        </p>
        <div className="mt-4 w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default PWASplashScreen;
