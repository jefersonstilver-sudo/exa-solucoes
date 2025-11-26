import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

interface FloatingCTAProps {
  variant?: 'default' | 'compact';
}

const FloatingCTA = ({ variant = 'default' }: FloatingCTAProps) => {
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

  const whatsappLink = "https://wa.me/5545991415920?text=Oi%2C%20tenho%20interesse%20em%20anunciar%20na%20EXA!";
  
  const sizeClasses = variant === 'compact' 
    ? 'w-12 h-12' 
    : 'w-14 h-14';
    
  const iconSize = variant === 'compact' 
    ? 'w-6 h-6' 
    : 'w-7 h-7';

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white ${sizeClasses} rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group animate-fade-in`}
      aria-label="Falar no WhatsApp com Sofia"
    >
      <MessageCircle className={`${iconSize} fill-white group-hover:scale-105 transition-transform`} />
    </a>
  );
};

export default FloatingCTA;
