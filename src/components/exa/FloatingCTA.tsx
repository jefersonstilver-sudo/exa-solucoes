import React, { useState, useEffect } from 'react';
import whatsapp24h from '@/assets/whatsapp-24h.png';

interface FloatingCTAProps {
  variant?: 'default' | 'compact';
}

const FloatingCTA = ({ variant = 'default' }: FloatingCTAProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if fullscreen map is open
  useEffect(() => {
    const checkMapState = () => {
      setIsMapOpen(document.body.classList.contains('map-fullscreen-open'));
    };

    // Check initially
    checkMapState();

    // Create observer for class changes
    const observer = new MutationObserver(checkMapState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Hide when map is open or not visible
  if (!isVisible || isMapOpen) return null;

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
      className={`fixed bottom-6 right-6 z-50 ${sizeClasses} rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group animate-fade-in`}
      aria-label="Falar no WhatsApp 24h"
    >
      <img 
        src={whatsapp24h} 
        alt="WhatsApp 24h" 
        className={`${sizeClasses} rounded-full group-hover:scale-105 transition-transform`}
      />
    </a>
  );
};

export default FloatingCTA;
