
import React, { useEffect } from 'react';
import ScrollProgressBar from '@/components/paineis-landing/ScrollProgressBar';
import HeroSection from '@/components/paineis-landing/HeroSection';
import Logo3DSection from '@/components/paineis-landing/Logo3DSection';
import AboutSection from '@/components/paineis-landing/AboutSection';
import GallerySection from '@/components/paineis-landing/GallerySection';
import BenefitsSection from '@/components/paineis-landing/BenefitsSection';
import CTASection from '@/components/paineis-landing/CTASection';

const PaineisPublicitarios = () => {
  console.log('PaineisPublicitarios component rendering...');

  useEffect(() => {
    console.log('PaineisPublicitarios mounted successfully');
    // Scroll suave para toda a página
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Cleanup
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Barra de progresso do scroll */}
      <ScrollProgressBar />
      
      {/* Logo 3D flutuante */}
      <Logo3DSection />
      
      {/* Seções principais */}
      <div className="snap-y snap-mandatory">
        <HeroSection />
        <AboutSection />
        <GallerySection />
        <BenefitsSection />
        <CTASection />
      </div>
    </div>
  );
};

export default PaineisPublicitarios;
