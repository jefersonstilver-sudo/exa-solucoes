import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

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

  const whatsappMessage = encodeURIComponent("Olá! Gostaria de anunciar com a EXA");
  const whatsappLink = `https://api.whatsapp.com/send/?phone=554591415856&text=${whatsappMessage}&type=phone_number&app_absent=0`;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-[#9C1E1E] to-[#180A0A] text-white px-6 py-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center space-x-2 group animate-fade-in"
    >
      <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span className="font-montserrat font-semibold hidden sm:inline">
        Falar no WhatsApp
      </span>
    </a>
  );
};

export default FloatingCTA;
