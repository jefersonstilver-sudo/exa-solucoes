import React, { useState, useEffect } from 'react';
import whatsappIcon from '@/assets/whatsapp-icon.png';

const FloatingCTA = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  const whatsappLink = "https://wa.me/554591415856";

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group animate-fade-in animate-pulse"
      aria-label="Falar no WhatsApp"
    >
      <img 
        src={whatsappIcon} 
        alt="WhatsApp" 
        className="w-10 h-10 sm:w-12 sm:h-12 group-hover:scale-110 transition-transform"
      />
    </a>
  );
};

export default FloatingCTA;
