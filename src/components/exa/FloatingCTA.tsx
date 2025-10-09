import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

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

  return (
    <Link
      to="/loja"
      className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-exa-purple to-exa-purple/90 text-white px-6 py-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center space-x-2 group animate-fade-in"
    >
      <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      <span className="font-montserrat font-semibold hidden sm:inline">
        Anuncie com a EXA
      </span>
    </Link>
  );
};

export default FloatingCTA;
