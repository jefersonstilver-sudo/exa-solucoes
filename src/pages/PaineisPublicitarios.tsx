
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/paineis-landing/HeroSection';
import AboutSection from '@/components/paineis-landing/AboutSection';
import GallerySection from '@/components/paineis-landing/GallerySection';
import BenefitsSection from '@/components/paineis-landing/BenefitsSection';
import HowItWorksSection from '@/components/paineis-landing/HowItWorksSection';
import CTASection from '@/components/paineis-landing/CTASection';
import ScrollProgressBar from '@/components/paineis-landing/ScrollProgressBar';

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
    <Layout>
      {/* Barra de progresso do scroll */}
      <ScrollProgressBar />
      
      {/* Seções principais com scroll snap */}
      <div className="snap-y snap-mandatory">
        <HeroSection />
        <AboutSection />
        <GallerySection />
        <BenefitsSection />
        <HowItWorksSection />
        <CTASection />
      </div>
    </Layout>
  );
};

export default PaineisPublicitarios;
